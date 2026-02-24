const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const replacements = [
    // shared
    { from: /@\/shared\//g, to: '@/modules/shared/' },
    { from: /@\/modules\/cart\/store/g, to: '@/modules/shared/store/cartStore' },
    { from: /@\/modules\/payment\/store/g, to: '@/modules/shared/store/paymentStore' },
    { from: /@\/modules\/payment\/types/g, to: '@/modules/shared/types/paymentTypes' },
    { from: /@\/modules\/hardware\/hooks\/usePrinter/g, to: '@/modules/shared/hooks/usePrinter' },
    { from: /@\/modules\/menu\/components\/ModifierModal/g, to: '@/modules/shared/components/modals/ModifierModal' },
    { from: /@\/modules\/order\/services\/orderApi/g, to: '@/modules/shared/services/orderApi' },
    { from: /@\/modules\/order\/types/g, to: '@/modules/shared/types/orderTypes' },
    { from: /@\/modules\/cart\/components\/CartView/g, to: '@/modules/shared/components/CartView' },
    { from: /@\/modules\/cart\/components\/NoteModal/g, to: '@/modules/shared/components/modals/NoteModal' },

    // pos
    { from: /@\/modules\/checkout\/store/g, to: '@/modules/pos/store/checkoutStore' },
    { from: /@\/modules\/checkout\/components\/CheckoutSidebar/g, to: '@/modules/pos/components/CheckoutSidebar' },
    { from: /@\/modules\/checkout\/components\/CheckoutFlowManager/g, to: '@/modules/pos/components/CheckoutFlowManager' },
    { from: /@\/modules\/payment\/components\/modals\/PaymentModalRoot/g, to: '@/modules/pos/components/modals/PaymentModalRoot' },
    { from: /@\/modules\/payment\/components\/modals\/CashPaymentModal/g, to: '@/modules/pos/components/modals/CashPaymentModal' },
    { from: /@\/modules\/payment\/components\/modals\/CardPaymentModal/g, to: '@/modules/pos/components/modals/CardPaymentModal' },
    { from: /@\/modules\/order\/components\/OrderListModal/g, to: '@/modules/pos/components/OrderListModal' },
    { from: /@\/modules\/order\/components\/OrderDetailModal/g, to: '@/modules/pos/components/OrderDetailModal' },
    { from: /@\/modules\/order\/components\/PhoneOrderModal/g, to: '@/modules/pos/components/modals/PhoneOrderModal' },

    // kiosk
    { from: /@\/app\/kiosk\/components\/KioskCart/g, to: '@/modules/kiosk/components/KioskCart' },
    { from: /@\/app\/kiosk\/components\/DayWarningModal/g, to: '@/modules/kiosk/components/modals/DayWarningModal' },
    { from: /\.\/components\/KioskCart/g, to: '@/modules/kiosk/components/KioskCart' },
    { from: /\.\/components\/DayWarningModal/g, to: '@/modules/kiosk/components/modals/DayWarningModal' },
];

walkDir('./src', function (filePath) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        replacements.forEach(r => {
            content = content.replace(r.from, r.to);
        });

        if (filePath.includes('pos/components/')) {
            content = content.replace(/from '\.\.\/store'/g, "from '../store/checkoutStore'");
            content = content.replace(/from '\.\.\/\.\.\/store'/g, "from '../../shared/store/paymentStore'");
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content);
        }
    }
});
