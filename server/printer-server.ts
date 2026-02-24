/// <reference types="node" />  <-- 이 줄을 파일 맨 위에 추가
import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import net from 'net';

const app = express();
const PORT = process.env.PORT || 4000;

// ==========================================
// ⚠️ [설정] 프린터 IP (환경 변수 또는 기본값)
// ==========================================
// 주방 및 쉐이크 프린터 (공용)
const KITCHEN_PRINTER_IP   = process.env.PRINTER_IP_KITCHEN || '192.168.50.3';
const MILKSHAKE_PRINTER_IP = process.env.PRINTER_IP_MILKSHAKE || '192.168.50.19';

// 영수증 프린터 IP (POS용 vs Kiosk용)
const RECEIPT_PRINTER_IP_POS   = process.env.PRINTER_IP_RECEIPT_POS || '192.168.50.201';
const RECEIPT_PRINTER_IP_KIOSK = process.env.PRINTER_IP_RECEIPT_KIOSK || '192.168.50.202';

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

// ==========================================
// 🛠️ [Type Definitions]
// ==========================================
interface Modifier {
  name?: string;
  label?: string;
  price?: number;
}

interface OrderItem {
  name: string;
  posName?: string;
  pos_name?: string;
  quantity: number;
  price?: number;
  totalPrice?: number;
  selectedModifiers?: Modifier[]; // POS uses this
  options?: Modifier[];           // Admin/DB might use this
  modifiers?: Modifier[];         // Legacy
  notes?: string;
}

interface PrintRequestBody {
  items: OrderItem[];
  tableNumber?: string;
  totalAmount?: number;
  subtotal?: number;
  tax?: number;
  tipAmount?: number;
  cardFee?: number;
  orderType?: 'dine_in' | 'to_go';
  employeeName?: string;
  paymentMethod?: string;
  printKitchen?: boolean;
  printReceipt?: boolean;
  source?: 'pos' | 'kiosk'; // 요청 출처 구분
  date?: string;
}

// ==========================================
// 🟢 [주방 약어 사전]
// ==========================================
const CUSTOM_ABBREVIATIONS: { [key: string]: string } = {
  'slaw': 'S', 'onion': 'O', 'mayo': 'M', 'ketchup': 'K', 'mustard': 'MUS',
  'lettuce': 'L', 'tomato': 'T', 'pickles': 'P', 'every': 'EVERY',
  'everything': 'EVERY', 'no bun': 'NO BUN', 'texas toast': 'Texas',
  'bbq sauce': 'BBQ',
  'make a meal - 1/2 onionring+d': 'Meal-1/2 O-Ring',
  'onion ring+soft drink': 'Meal-1/2 O-Ring',
  'make a meal-1/2ff+d': 'Meal-1/2 FF',
  '1/2frenchfries+softdrink': 'Meal-1/2 FF',
  'extra slaw': 'X-Slaw', 'extra lettuce': 'X-L', 'extra tomato': 'X-T',
  'extra pickles': 'X-P', 'add bacon': 'Add BAC', 'add chili': 'Add Chili',
  'add grilled onions': 'Add G-Onion', 'add cheese': 'Add Chese',
  'extra cheese': 'Extra Chese', 'extra patty': 'X-Patty',
  'italian': 'Italian', 'ranch': 'Ranch', 'wheat': 'Wheat',
  'white': 'White', 'malt': 'Malt', 'to go': 'TO GO', 'dine in': 'Dine In'
};

function getAbbreviatedMod(name: string): string {
  if (!name) return '';
  let modName = name.trim();
  const lowerName = modName.toLowerCase();
  
  if (CUSTOM_ABBREVIATIONS[lowerName]) return CUSTOM_ABBREVIATIONS[lowerName];
  
  let prefix = "";
  if (lowerName.startsWith("no ")) { prefix = "NO "; modName = modName.substring(3).trim(); }
  else if (lowerName.startsWith("add ")) { prefix = "ADD "; modName = modName.substring(4).trim(); }
  
  return prefix + modName.charAt(0).toUpperCase() + modName.slice(1);
}

function formatCloverDate(dateObj: Date): string {
  const day = dateObj.getDate().toString().padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
}

// ==========================================
// 🖨️ [네트워크 프린터 전송 함수] (TCP/IP Raw)
// ==========================================
function sendToNetworkPrinter(ip: string, buffer: string, label: string): Promise<void> {
  return new Promise((resolve) => {
    console.log(`⏳ [${label}] IP 연결 시도 -> ${ip}:9100`);
    const client = new net.Socket();
    client.setTimeout(3000);

    client.connect(9100, ip, () => {
      console.log(`⚡ [${label}] 연결 성공! 데이터 전송 중...`);
      client.write(Buffer.from(buffer, 'binary')); // 문자열을 바이너리 버퍼로 변환
      client.end();
    });

    client.on('close', () => { console.log(`✅ [${label}] 전송 완료 & 연결 종료`); resolve(); });
    client.on('error', (err) => { console.error(`⚠️ [${label}] 연결 실패(에러): ${err.message}`); client.destroy(); resolve(); });
    client.on('timeout', () => { console.error(`⚠️ [${label}] 타임아웃(응답없음)`); client.destroy(); resolve(); });
  });
}

// ==========================================
// 📝 [주방 주문서 생성 로직]
// ==========================================
function generateKitchenBuffer(items: OrderItem[], tableNumber: string | undefined, orderId: any, title: string, useAbbreviations: boolean, employeeName?: string) {
  const INIT = '\x1b\x40'; const RED = '\x1b\x34'; const BLACK = '\x1b\x35';
  const ALIGN_CENTER = '\x1b\x1d\x61\x01'; const ALIGN_LEFT = '\x1b\x1d\x61\x00';
  const ALIGN_RIGHT = '\x1b\x1d\x61\x02'; const CUT = '\x1b\x64\x02';
  const BIG_FONT = '\x1b\x57\x01\x1b\x68\x01';

  const now = new Date();
  const dateStr = formatCloverDate(now);
  const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }).replace(' PM', 'P').replace(' AM', 'A');
  const displayOrderNum = (tableNumber && tableNumber !== 'To Go') ? tableNumber : "00";
  const typeText = (tableNumber && tableNumber !== 'To Go') ? "Dine In" : "To Go";
  const serverName = employeeName || "Kiosk";

  let buffer = INIT + ALIGN_CENTER + BLACK + BIG_FONT;
  buffer += `${title}\nORDER: ${displayOrderNum}\n` + RED + `${typeText}\n`;
  buffer += ALIGN_LEFT + BLACK + `${dateStr} ${timeStr}\nServer: ${serverName}\n----------------\n`;

  items.forEach((item, index) => {
    const name = item.posName || item.pos_name || item.name || 'Unknown';
    const qty = item.quantity || 1;
    const displayName = qty > 1 ? `${qty} ${name}` : name;
    
    buffer += ALIGN_LEFT + BLACK + displayName + "\n";
    if (item.notes) buffer += RED + `  * ${item.notes} *\n` + BLACK;

    // 옵션 처리 (통합)
    const modifiers = item.selectedModifiers || item.options || item.modifiers || [];
    if (modifiers.length > 0) {
      buffer += ALIGN_RIGHT + RED;
      modifiers.forEach(mod => {
        const originalName = (typeof mod === 'string') ? mod : (mod.name || mod.label || "Option");
        const modText = useAbbreviations ? getAbbreviatedMod(originalName) : originalName;
        buffer += `${modText}\n`;
      });
      buffer += ALIGN_LEFT + BLACK;
    }
    if (index < items.length - 1) buffer += "----------------\n";
  });
  buffer += "----------------\nID: " + displayOrderNum + "\n\n\n" + CUT;
  return buffer;
}

// ==========================================
// 🧾 [고객 영수증 생성 로직]
// ==========================================
function generateReceiptBuffer(data: PrintRequestBody) {
  const { items, tableNumber, subtotal, tax, tipAmount, totalAmount, date, orderType, employeeName, paymentMethod, cardFee } = data;
  const displayOrderNum = (tableNumber && tableNumber !== 'To Go') ? tableNumber : "To Go";
  const displayType = (orderType === 'dine_in') ? "Dine In" : "To Go";
  const serverName = employeeName || "Kiosk";
  const orderDate = date || formatCloverDate(new Date());

  const ESC = '\x1b'; const ALIGN_CENTER = '\x1b\x61\x01'; const ALIGN_LEFT = '\x1b\x61\x00';
  const ALIGN_RIGHT = '\x1b\x61\x02'; const BOLD_ON = '\x1b\x45\x01'; const BOLD_OFF = '\x1b\x45\x00';
  const DOUBLE_HEIGHT = '\x1b\x21\x10'; const NORMAL = '\x1b\x21\x00'; const CUT = '\x1d\x56\x42\x00';

  let buffer = ESC + '@' + ALIGN_CENTER + BOLD_ON + "COLLEGIATE GRILL\n" + BOLD_OFF + NORMAL;
  buffer += "Customer Receipt\n" + DOUBLE_HEIGHT + `[ ${displayType} ]\n` + NORMAL;
  buffer += `Date: ${orderDate}\nServer: ${serverName}\n--------------------------------\n`;
  buffer += ALIGN_LEFT + DOUBLE_HEIGHT + BOLD_ON;
  buffer += (displayOrderNum === "To Go") ? "Order Type: To Go\n" : `Order #: ${displayOrderNum}\n`;
  buffer += NORMAL + BOLD_OFF + "--------------------------------\n";

  items.forEach(item => {
    const qty = item.quantity || 1;
    const price = (item.totalPrice || item.price || 0).toFixed(2);
    const name = item.posName || item.pos_name || item.name || 'Unknown';

    buffer += BOLD_ON + `${qty} ${name}` + BOLD_OFF + "\n";
    
    const modifiers = item.selectedModifiers || item.options || item.modifiers || [];
    if (modifiers.length > 0) {
      modifiers.forEach(mod => {
         const modName = (typeof mod === 'string') ? mod : (mod.name || mod.label || "");
         const modPrice = (typeof mod === 'object' && mod.price) ? mod.price : 0;
         buffer += `   + ${modName} ($${modPrice.toFixed(2)})\n`;
      });
    }
    // 총 아이템 가격 (우측 정렬)
    // buffer += ALIGN_RIGHT + `$${price}\n` + ALIGN_LEFT; 
    // *수정: 위 코드가 레이아웃을 깰 수 있으므로 아래와 같이 처리 가능, 혹은 그대로 유지
    buffer += ALIGN_RIGHT + `$${price}\n` + ALIGN_LEFT;
  });

  buffer += "--------------------------------\n" + ALIGN_RIGHT;
  buffer += `Subtotal: $${(subtotal || 0).toFixed(2)}\nTax: $${(tax || 0).toFixed(2)}\n`;

  // 카드 수수료 표시
  if (cardFee && cardFee > 0) {
    buffer += `Card Fee (3%): $${cardFee.toFixed(2)}\n`;
  }

  if (tipAmount && tipAmount > 0) buffer += BOLD_ON + `Tip: $${tipAmount.toFixed(2)}\n` + BOLD_OFF;
  buffer += "--------------------------------\n";
  buffer += DOUBLE_HEIGHT + BOLD_ON + `TOTAL: $${(totalAmount || 0).toFixed(2)}\n` + NORMAL + BOLD_OFF;
  
  if (paymentMethod) buffer += ALIGN_LEFT + NORMAL + `Payment: ${paymentMethod}\n` + ALIGN_CENTER;
  buffer += ALIGN_CENTER + "\n\nThank You!\n\n\n\n\n" + CUT;
  return buffer;
}

// ==========================================
// 🔓 [돈통 열기 API]
// ==========================================
app.post('/open-drawer', async (req: Request, res: Response) => {
  try {
    console.log("📂 [요청] 돈통 열기 시도...");
    
    // 돈통은 'POS 영수증 프린터' 뒤에 연결되어 있습니다.
    const drawerCommand = '\x1b\x70\x00\x19\xfa'; // 표준 ESC/POS 돈통 열기 명령
    
    // POS용 영수증 프린터로 명령 전송
    await sendToNetworkPrinter(RECEIPT_PRINTER_IP_POS, drawerCommand, "CashDrawer");
    
    console.log("✅ 돈통 열기 명령 전송 완료");
    res.json({ success: true });
  } catch (e: any) {
    console.error("❌ 돈통 열기 실패:", e.message);
    res.json({ success: false, error: e.message });
  }
});

// ==========================================
// 🖨️ [인쇄 API]
// ==========================================
app.post('/print', async (req: Request, res: Response) => {
  try {
    console.log("------------------------------------------------");
    const body: PrintRequestBody = req.body;
    console.log(`📩 [인쇄 요청] 주문번호: ${body.tableNumber || 'Unknown'} | Source: ${body.source || 'POS'}`);

    const { 
      items, tableNumber, totalAmount, orderType, employeeName, paymentMethod,
      printKitchen, printReceipt, source 
    } = body;

    const milkshakeItems: OrderItem[] = [];
    const kitchenItems: OrderItem[] = [];

    if (items) {
      items.forEach(item => {
        const nameToCheck = (item.posName || item.pos_name || item.name || "").toLowerCase();
        if (nameToCheck.includes('milkshake') || nameToCheck.includes('shake')) {
          milkshakeItems.push(item);
        } else {
          kitchenItems.push(item);
        }
      });
    }

    const printPromises: Promise<void>[] = [];

    // 1. 주방 프린터 (공용)
    if (printKitchen) {
      if (kitchenItems.length > 0) {
        console.log("🍔 주방 프린터로 전송 중...");
        const buffer = generateKitchenBuffer(kitchenItems, tableNumber, null, "KITCHEN", true, employeeName);
        printPromises.push(sendToNetworkPrinter(KITCHEN_PRINTER_IP, buffer, "Kitchen"));
      }
      if (milkshakeItems.length > 0) {
        console.log("🥤 쉐이크 프린터로 전송 중...");
        const buffer = generateKitchenBuffer(milkshakeItems, tableNumber, null, "MILKSHAKE", true, employeeName);
        printPromises.push(sendToNetworkPrinter(MILKSHAKE_PRINTER_IP, buffer, "Shake"));
      }
    }

    // 2. 영수증 프린터 (POS vs Kiosk 분리)
    if (printReceipt && totalAmount !== undefined) {
      let targetReceiptIP = RECEIPT_PRINTER_IP_POS; // 기본값 POS
      let label = "Receipt(POS)";

      if (source === 'kiosk') {
        targetReceiptIP = RECEIPT_PRINTER_IP_KIOSK;
        label = "Receipt(Kiosk)";
      }

      console.log(`🧾 ${label} 프린터로 전송 중... (IP: ${targetReceiptIP})`);
      const receiptBuffer = generateReceiptBuffer(body);
      printPromises.push(sendToNetworkPrinter(targetReceiptIP, receiptBuffer, label));
    }

    await Promise.all(printPromises);
    console.log("✅ 모든 인쇄 작업 완료");
    console.log("------------------------------------------------");
    res.json({ success: true, message: 'Processed successfully' });

  } catch (e: any) {
    console.error("❌ Print Server Error:", e.message);
    res.json({ success: true, message: 'Error handled', error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Printer Server running on http://localhost:${PORT}`);
});