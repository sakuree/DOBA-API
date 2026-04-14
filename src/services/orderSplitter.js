/**
 * 多件订单拆单模块
 * 
 * 当 quantity > 1 时，将一个订单拆分为多个子订单：
 *   - 每个子订单 quantity = 1
 *   - 订单号加后缀 -1, -2, ...
 *   - 每个子订单分配独立的物流号和面单
 * 
 * 面单匹配策略：
 *   A. 文件名含物流号（HomeDepot: PO_Tracking.PDF）→ 精确匹配
 *   B. 文件名按序号（Lowes: PO-1.pdf）→ 按序号顺序匹配
 *   C. 合并 PDF 单文件 → pdf-lib 按页拆分后顺序匹配
 */

/**
 * 从采购SKU解析每套件数
 * 规则：SKU 尾部 *N (N≥2) 表示 N 件套
 * 例: "2-HDP4003D7063*2" → 2件套
 * 例: "B0BC1F34JL" → 1件套（无尾部 *N 标记）
 * @param {string} purchaseSku - 采购SKU
 * @returns {number} 每套件数（最小为 1）
 */
function parsePiecesPerSet(purchaseSku) {
  if (!purchaseSku || typeof purchaseSku !== 'string') return 1;
  const match = purchaseSku.match(/\*(\d+)$/);
  if (match) {
    const n = parseInt(match[1]);
    return n >= 2 ? n : 1;
  }
  return 1;
}

/**
 * 从仓库SKU (item_number) 解析多件套后缀，提取干净SKU和件套数
 * 规则：末尾 *N / XN / xN (N≥2) 表示 N 件套，前面可有空格
 * 例: "H2SA11-3OT089 *2" → { cleanSku: 'H2SA11-3OT089', piecesPerSet: 2 }
 * 例: "H2SA11-3OT089X2"  → { cleanSku: 'H2SA11-3OT089', piecesPerSet: 2 }
 * 例: "B0BC1F34JL"       → { cleanSku: 'B0BC1F34JL', piecesPerSet: 1 }
 * @param {string} itemNumber - 仓库SKU
 * @returns {{ cleanSku: string, piecesPerSet: number }}
 */
function parseItemNumber(itemNumber) {
  if (!itemNumber || typeof itemNumber !== 'string') {
    return { cleanSku: itemNumber || '', piecesPerSet: 1 };
  }
  const trimmed = itemNumber.trim();
  // 匹配末尾 *N / XN / xN（前面可有可选空格）
  const match = trimmed.match(/^(.+?)\s*[*xX](\d+)$/);
  if (match) {
    const n = parseInt(match[2]);
    return { cleanSku: match[1].trim(), piecesPerSet: n >= 2 ? n : 1 };
  }
  return { cleanSku: trimmed, piecesPerSet: 1 };
}

/**
 * 拆分多件订单列表
 * @param {object[]} orders - 标准化订单列表
 * @returns {Promise<object[]>} 拆分后的订单列表（单件订单不变）
 */
async function splitOrders(orders) {
  const result = [];

  for (const order of orders) {
    const qty = parseInt(order.quantity) || 1;

    // 解析件套数：优先从采购SKU获取，其次从仓库SKU获取
    const piecesFromPurchase = parsePiecesPerSet(order.purchase_sku);
    const itemInfo = parseItemNumber(order.item_number);
    const piecesPerSet = piecesFromPurchase > 1 ? piecesFromPurchase : itemInfo.piecesPerSet;
    const cleanSku = itemInfo.cleanSku;

    if (piecesPerSet > 1) {
      const source = piecesFromPurchase > 1 ? `采购SKU="${order.purchase_sku}"` : `仓库SKU="${order.item_number}"`;
      console.log(`📦 [件套] ${order.po_number}: ${source} → ${piecesPerSet}件套, 干净SKU="${cleanSku}"`);
    }

    // 单件订单不拆分（但仍需要携带件套信息和干净SKU）
    if (qty <= 1) {
      result.push({ ...order, _pieces_per_set: piecesPerSet, _clean_sku: cleanSku, _raw_item_number: (order.item_number || '').trim() });
      continue;
    }

    console.log(`🔀 [拆单] ${order.po_number}: 数量=${qty}，开始拆分...`);

    try {
      const subOrders = await splitSingleOrder(order, qty, piecesPerSet, cleanSku);
      result.push(...subOrders);
      console.log(`  ✅ 拆分为 ${subOrders.length} 个子订单: ${subOrders.map(o => o.po_number).join(', ')}`);
    } catch (err) {
      console.error(`  ❌ 拆单失败: ${err.message}，将以原始订单推送`);
      result.push({ ...order, _pieces_per_set: piecesPerSet, _clean_sku: cleanSku });
    }
  }

  const splitCount = result.length - orders.length;
  if (splitCount > 0) {
    console.log(`📊 [拆单] 拆单完成: ${orders.length} 个原始订单 → ${result.length} 个订单 (新增 ${splitCount} 个子订单)`);
  }

  return result;
}

/**
 * 拆分单个多件订单（支持合单）
 * 
 * 合单逻辑：当物流号数量 < 购买数量时，说明多件商品合并到同一包裹发货
 * 例: qty=4, tracking=2 → 创建 2 个子面单，每个子面单的 quantity=2
 * 例: qty=5, tracking=2 → 创建 2 个子面单，quantity 分别为 3 和 2
 * 
 * @param {object} order - 原始订单
 * @param {number} qty - 购买数量
 * @param {number} piecesPerSet - 每套件数（从采购SKU解析）
 * @returns {Promise<object[]>} 子订单列表
 */
async function splitSingleOrder(order, qty, piecesPerSet = 1, cleanSku = '') {
  // Step 1: 解析物流号列表
  const trackingList = parseTrackingNumbers(order.tracking, qty);
  const actualCount = trackingList.length;

  // Step 2: 判断合单 or 正常拆单
  const isConsolidation = actualCount > 0 && actualCount < qty;

  if (isConsolidation) {
    console.log(`  📦 [合单] 物流号数量(${actualCount}) < 购买数量(${qty})，合单处理: ${qty} 件商品合为 ${actualCount} 个包裹`);
  } else if (actualCount !== qty) {
    console.log(`  ⚠️ 物流号数量(${actualCount}) ≠ 购买数量(${qty})，按物流号数量 ${actualCount} 拆分`);
  }

  // Step 3: 解析面单文件列表（可能需要拆分 PDF）
  const labelList = await matchLabels(order, trackingList);

  // Step 4: 计算每个子订单的数量
  // 合单时：将总数量均匀分配到各子订单，余数分配给前面的子订单
  // 正常拆单：每个子订单 quantity=1
  let subQtyList;
  if (isConsolidation) {
    const baseQty = Math.floor(qty / actualCount);
    const remainder = qty % actualCount;
    subQtyList = [];
    for (let i = 0; i < actualCount; i++) {
      subQtyList.push(i < remainder ? baseQty + 1 : baseQty);
    }
    console.log(`  📊 [合单] 数量分配: ${subQtyList.map((q, i) => `包裹${i + 1}=${q}件`).join(', ')}`);
  } else {
    subQtyList = new Array(actualCount).fill(1);
  }

  // Step 5: 生成子订单
  const subOrders = [];
  for (let i = 0; i < actualCount; i++) {
    const subQty = subQtyList[i];
    const subOrder = {
      ...order,
      po_number: `${order.po_number}-${i + 1}`,
      quantity: subQty,
      tracking: trackingList[i] || '',
      label_files: labelList[i] ? [labelList[i]] : undefined,
      // 保留原始 PO 号用于回写
      _original_po: order.po_number,
      _sub_index: i + 1,
      _sub_total: actualCount,
      _pieces_per_set: piecesPerSet,
      _clean_sku: cleanSku || order.item_number || '',
      _raw_item_number: (order.item_number || '').trim(),
    };

    const pcsInfo = piecesPerSet > 1 ? `, ${piecesPerSet}件套(实发${subQty * piecesPerSet}件)` : '';
    const consolidateInfo = isConsolidation ? ` [合${subQty}件]` : '';
    console.log(`  📦 子订单 ${subOrder.po_number}: qty=${subQty}${consolidateInfo}, tracking=${subOrder.tracking || '(无)'}, label=${subOrder.label_files?.[0]?.name || '(无)'}${pcsInfo}`);
    subOrders.push(subOrder);
  }

  return subOrders;
}

/**
 * 解析物流号字符串为数组
 * @param {string} trackingStr - 逗号/换行分隔的物流号字符串
 * @param {number} expectedCount - 预期数量
 * @returns {string[]} 物流号列表
 */
function parseTrackingNumbers(trackingStr, expectedCount) {
  if (!trackingStr || typeof trackingStr !== 'string') {
    // 无物流号，生成空数组
    console.log(`  ⚠️ 无物流号数据，将创建 ${expectedCount} 个无物流号的子订单`);
    return new Array(expectedCount).fill('');
  }

  const list = trackingStr
    .split(/[,，;\n\r]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  if (list.length === 0) {
    return new Array(expectedCount).fill('');
  }

  console.log(`  📋 解析到 ${list.length} 个物流号`);
  return list;
}

/**
 * 匹配面单文件到物流号列表
 * @param {object} order - 原始订单
 * @param {string[]} trackingList - 物流号列表
 * @returns {Promise<Array<{name: string, url: string}|null>>} 与 trackingList 等长的面单数组
 */
async function matchLabels(order, trackingList) {
  const labels = order.label_files;
  const count = trackingList.length;

  // 无面单
  if (!labels || !Array.isArray(labels) || labels.length === 0) {
    console.log(`  ⚠️ 无面单文件`);
    return new Array(count).fill(null);
  }

  console.log(`  📄 面单文件 ${labels.length} 个: ${labels.map(l => l.name).join(', ')}`);

  // 判断匹配策略
  const strategy = detectStrategy(labels, trackingList, order.po_number);
  console.log(`  🎯 匹配策略: ${strategy}`);

  switch (strategy) {
    case 'by_tracking_in_filename':
      return matchByTrackingInFilename(labels, trackingList);

    case 'by_sequence_number':
      return matchBySequenceNumber(labels, trackingList, order.po_number);

    case 'split_pdf':
      return await splitPdfAndMatch(labels[0], trackingList, order.po_number);

    default:
      // 降级：按顺序一一对应
      return matchByOrder(labels, trackingList);
  }
}

/**
 * 检测面单匹配策略
 */
function detectStrategy(labels, trackingList, poNumber) {
  // 策略 A: 文件名中包含物流号（HomeDepot 模式）
  // 例: 09866847_1ZB2163Y0321057375.PDF
  const hasTrackingInName = trackingList.some(t =>
    t && labels.some(l => l.name && l.name.includes(t))
  );
  if (hasTrackingInName) {
    return 'by_tracking_in_filename';
  }

  // 策略 C: 只有一个 PDF 文件但有多个物流号（合并 PDF）
  if (labels.length === 1 && trackingList.length > 1) {
    const name = (labels[0].name || '').toLowerCase();
    if (name.endsWith('.pdf')) {
      return 'split_pdf';
    }
  }

  // 策略 B: 文件名含序号（Lowes/Target 模式）
  // 例: 295051197-1.pdf, 295051197-2.pdf
  const hasSequenceNum = labels.some(l => {
    const name = l.name || '';
    // 匹配 PO-N.pdf 或 PO-N-M.pdf 模式
    return /[-_]\d+\.pdf$/i.test(name);
  });
  if (hasSequenceNum && labels.length > 1) {
    return 'by_sequence_number';
  }

  // 默认：按顺序对应
  return 'by_order';
}

/**
 * 策略 A: 通过文件名中的物流号精确匹配
 * HomeDepot 模式: PO_TrackingNumber.PDF
 */
function matchByTrackingInFilename(labels, trackingList) {
  const result = [];

  for (const tracking of trackingList) {
    if (!tracking) {
      result.push(null);
      continue;
    }

    const matched = labels.find(l =>
      l.name && l.name.includes(tracking)
    );

    if (matched) {
      result.push({ name: matched.name, url: matched.url, key: matched.key });
    } else {
      console.log(`    ⚠️ 物流号 ${tracking} 未找到匹配的面单`);
      result.push(null);
    }
  }

  return result;
}

/**
 * 策略 B: 通过文件名中的序号排序匹配
 * Lowes 模式: PO-1.pdf, PO-2.pdf, ...
 */
function matchBySequenceNumber(labels, trackingList, poNumber) {
  // 从文件名提取序号并排序
  const sorted = [...labels]
    .map(l => {
      const name = l.name || '';
      // 尝试提取最后一个数字序号
      // 兼容: PO-1.pdf, PO-2-1.pdf 等格式
      const match = name.match(/[-_](\d+)\.pdf$/i);
      const seq = match ? parseInt(match[1]) : 999;
      return { ...l, _seq: seq };
    })
    .sort((a, b) => a._seq - b._seq);

  const result = [];
  for (let i = 0; i < trackingList.length; i++) {
    if (i < sorted.length) {
      result.push({ name: sorted[i].name, url: sorted[i].url, key: sorted[i].key });
    } else {
      console.log(`    ⚠️ 序号 ${i + 1} 无对应面单文件`);
      result.push(null);
    }
  }

  return result;
}

/**
 * 从文本中查找匹配 trackingList 中的物流号
 * @param {string} text - PDF 页面提取的文本
 * @param {string[]} trackingList - 目标物流号列表
 * @returns {string|null} 匹配到的物流号，或 null
 */
function extractTrackingFromPageText(text, trackingList) {
  if (!text || !trackingList || trackingList.length === 0) return null;

  // 直接在文本中查找 trackingList 中的任一物流号
  for (const tracking of trackingList) {
    if (tracking && text.includes(tracking)) {
      return tracking;
    }
  }

  return null;
}

/**
 * 策略 C: 拆分合并 PDF（按页拆分 + 智能物流号匹配）
 * 每页 = 一个面单
 * 新逻辑：先从每页 PDF 内容中提取物流号，精确匹配到对应的 tracking
 * 降级逻辑：如果无法提取物流号，则按原来的顺序匹配
 */
async function splitPdfAndMatch(labelFile, trackingList, poNumber) {
  const count = trackingList.length;

  try {
    const fetch = (await import('node-fetch')).default;
    const { PDFDocument } = await import('pdf-lib');

    // 下载 PDF
    console.log(`  📥 下载合并 PDF: ${labelFile.name}...`);
    const controller = new AbortController();
    const downloadTimeout = setTimeout(() => controller.abort(), 30000);
    const pdfRes = await fetch(labelFile.url, { signal: controller.signal });
    clearTimeout(downloadTimeout);
    if (!pdfRes.ok) {
      console.log(`  ❌ PDF 下载失败: HTTP ${pdfRes.status}`);
      return new Array(count).fill(null);
    }

    const pdfBytes = await pdfRes.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfBytes);
    console.log(`  ✅ PDF 下载成功 (${Math.round(pdfBuffer.length / 1024)}KB)`);

    // 加载 PDF
    const srcDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = srcDoc.getPageCount();
    console.log(`  📄 PDF 共 ${totalPages} 页，需要拆分为 ${count} 份`);

    if (totalPages < count) {
      console.log(`  ⚠️ PDF 页数(${totalPages}) < 物流号数量(${count})，部分子订单将无面单`);
    }

    // Step 1: 按页拆分 PDF，生成每页的 base64 和独立 PDF buffer
    const pages = []; // { pageIndex, base64, pdfBytes }
    for (let i = 0; i < Math.min(totalPages, count); i++) {
      try {
        const newDoc = await PDFDocument.create();
        const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
        newDoc.addPage(copiedPage);
        const newPdfBytes = await newDoc.save();
        const base64 = Buffer.from(newPdfBytes).toString('base64');

        pages.push({
          pageIndex: i,
          base64,
          pdfBytes: Buffer.from(newPdfBytes),
          sizeKB: Math.round(newPdfBytes.length / 1024),
        });
      } catch (pageErr) {
        console.log(`    ❌ 第 ${i + 1} 页拆分失败: ${pageErr.message}`);
        pages.push({ pageIndex: i, base64: null, pdfBytes: null, sizeKB: 0 });
      }
    }

    // Step 2: 从每页提取文本，识别物流号
    let pdfParse;
    try {
      pdfParse = require('pdf-parse');
    } catch {
      console.log(`  ⚠️ pdf-parse 未安装，降级为顺序匹配`);
      pdfParse = null;
    }

    // pageTrackingMap: pageIndex → 从该页提取到的 tracking
    const pageTrackingMap = new Map();
    let extractSuccessCount = 0;

    if (pdfParse) {
      console.log(`  🔍 开始从 PDF 页面中提取物流号...`);
      for (const page of pages) {
        if (!page.pdfBytes) continue;
        try {
          const parsed = await pdfParse(page.pdfBytes);
          const pageText = parsed.text || '';
          const matched = extractTrackingFromPageText(pageText, trackingList);
          if (matched) {
            pageTrackingMap.set(page.pageIndex, matched);
            extractSuccessCount++;
            console.log(`    ✅ 第 ${page.pageIndex + 1} 页 → 识别到物流号: ${matched}`);
          } else {
            console.log(`    ⚠️ 第 ${page.pageIndex + 1} 页 → 未识别到物流号 (文本前100字: ${pageText.replace(/\s+/g, ' ').substring(0, 100)})`);
          }
        } catch (parseErr) {
          console.log(`    ⚠️ 第 ${page.pageIndex + 1} 页文本提取失败: ${parseErr.message}`);
        }
      }
      console.log(`  📊 纯文本提取结果: ${extractSuccessCount}/${pages.length} 页成功识别`);
    }

    // Step 2.5: 图像条码识别 (Fallback OCR)
    // 如果纯文本未能完全识别所有页面，并且我们还没有匹配完所有页，尝试将 PDF 渲染为图片并扫描条形码
    if (extractSuccessCount < Math.min(pages.length, count)) {
      console.log(`  📸 启动图像条码识别 (有 ${Math.min(pages.length, count) - extractSuccessCount} 页尚未识别出物流号)...`);
      try {
        const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
        const { readBarcodesFromImageData } = await import('zxing-wasm/reader');
        const Canvas = require('canvas');

        // 使用 Uint8Array 避免 pdf.js 的 Buffer 警告
        const uint8Data = new Uint8Array(pdfBuffer);
        const loadingTask = pdfjsLib.getDocument({ data: uint8Data, disableFontFace: true });
        const pdfDoc = await loadingTask.promise;

        for (const page of pages) {
          // 如果该页已经有了识别结果，跳过
          if (pageTrackingMap.has(page.pageIndex) || !page.base64) continue;
          
          try {
             // pdf.js 页码是从 1 开始的
             const pdfPage = await pdfDoc.getPage(page.pageIndex + 1);
             const viewport = pdfPage.getViewport({ scale: 2.0 }); // 2倍缩放提高条码清晰度
             const canvas = Canvas.createCanvas(viewport.width, viewport.height);
             const context = canvas.getContext('2d');
             
             await pdfPage.render({ canvasContext: context, viewport }).promise;
             const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
             
             // 扫描图像中的条形码
             const barcodes = await readBarcodesFromImageData(imageData, {
               formats: ['Code128', 'Code39', 'ITF', 'QRCode', 'DataMatrix'],
               tryHarder: true,
             });
             
             // 在所有扫出的条码中，查找是否包含目标物流号
             for (const barcode of barcodes) {
               const text = barcode.text.toUpperCase();
               const matched = trackingList.find(t => text.includes(t.toUpperCase()));
               if (matched) {
                 pageTrackingMap.set(page.pageIndex, matched);
                 extractSuccessCount++;
                 console.log(`    ✅ 第 ${page.pageIndex + 1} 页 → [图像识别] 成功匹配物流号: ${matched} (条码:${barcode.format})`);
                 break;
               }
             }
             
             if (!pageTrackingMap.has(page.pageIndex)) {
                console.log(`    ⚠️ 第 ${page.pageIndex + 1} 页 → [图像识别] 检测到 ${barcodes.length} 个条码，但无一匹配目标物流号`);
             }
          } catch (imgErr) {
             console.log(`    ⚠️ 第 ${page.pageIndex + 1} 页图像解析失败: ${imgErr.message}`);
          }
        }
      } catch (modErr) {
        console.log(`  ⚠️ 图像识别引擎缺失或无法加载 (${modErr.message})，跳过该阶段`);
      }
    }

    // Step 3: 构建最终结果 — 精确匹配 or 降级顺序匹配
    const useSmartMatch = extractSuccessCount > 0 && extractSuccessCount >= count;

    if (useSmartMatch) {
      console.log(`  🎯 使用精确匹配模式（所需要的页面均已识别物流号）`);
    } else if (extractSuccessCount > 0) {
      console.log(`  ⚠️ 部分页面未识别物流号 (${extractSuccessCount}/${pages.length})，使用混合匹配（已识别的精确匹配，未识别的顺序填充）`);
    } else {
      console.log(`  ⚠️ 无法从 PDF 中提取物流号，降级为顺序匹配`);
    }

    const result = new Array(count).fill(null);
    const usedPageIndices = new Set();

    // 第一轮：精确匹配（有提取到物流号的页面）
    if (extractSuccessCount > 0) {
      for (const [pageIndex, matchedTracking] of pageTrackingMap) {
        const trackingIdx = trackingList.indexOf(matchedTracking);
        if (trackingIdx !== -1 && result[trackingIdx] === null) {
          const page = pages.find(p => p.pageIndex === pageIndex);
          if (page && page.base64) {
            const name = `${poNumber}_${matchedTracking}.pdf`;
            result[trackingIdx] = {
              name,
              url: labelFile.url,
              _base64: page.base64,
              _splitFromPage: pageIndex + 1,
              _matchMethod: 'smart',
            };
            usedPageIndices.add(pageIndex);
            console.log(`    🎯 物流号 ${matchedTracking} → 第 ${pageIndex + 1} 页 (精确匹配)`);
          }
        }
      }
    }

    // 第二轮：未匹配的按顺序填充
    const unusedPages = pages.filter(p => !usedPageIndices.has(p.pageIndex) && p.base64);
    let unusedIdx = 0;
    for (let i = 0; i < count; i++) {
      if (result[i] === null && unusedIdx < unusedPages.length) {
        const page = unusedPages[unusedIdx++];
        const tracking = trackingList[i] || `page${i + 1}`;
        const name = `${poNumber}_${tracking}.pdf`;
        result[i] = {
          name,
          url: labelFile.url,
          _base64: page.base64,
          _splitFromPage: page.pageIndex + 1,
          _matchMethod: 'fallback_order',
        };
        console.log(`    📄 物流号 ${tracking} → 第 ${page.pageIndex + 1} 页 (顺序填充)`);
      }
    }

    // 日志汇总
    const smartCount = result.filter(r => r && r._matchMethod === 'smart').length;
    const fallbackCount = result.filter(r => r && r._matchMethod === 'fallback_order').length;
    const nullCount = result.filter(r => r === null).length;
    console.log(`  📊 匹配结果: 精确=${smartCount}, 顺序填充=${fallbackCount}, 无面单=${nullCount}`);

    return result;
  } catch (err) {
    console.error(`  ❌ PDF 拆分异常: ${err.message}`);
    return new Array(count).fill(null);
  }
}

/**
 * 默认策略: 按顺序一一对应
 */
function matchByOrder(labels, trackingList) {
  const result = [];
  for (let i = 0; i < trackingList.length; i++) {
    if (i < labels.length) {
      result.push({ name: labels[i].name, url: labels[i].url, key: labels[i].key });
    } else {
      result.push(null);
    }
  }
  return result;
}

module.exports = {
  splitOrders,
  splitSingleOrder,
  parseTrackingNumbers,
  matchLabels,
  splitPdfAndMatch,
  parsePiecesPerSet,
  parseItemNumber,
};
