#!/bin/bash
mkdir -p src/modules/shared/components/modals src/modules/shared/components/ui src/modules/shared/store src/modules/shared/hooks src/modules/shared/services src/modules/shared/types src/modules/shared/lib src/modules/pos/components/modals src/modules/pos/store src/modules/pos/services src/modules/kiosk/components/modals src/modules/kiosk/store

cp -r src/shared/* src/modules/shared/ 2>/dev/null
rm -rf src/shared

mv src/modules/cart/components/* src/modules/shared/components/ 2>/dev/null
mv src/modules/cart/store.ts src/modules/shared/store/cartStore.ts 2>/dev/null
rm -rf src/modules/cart

mv src/modules/hardware/hooks/* src/modules/shared/hooks/ 2>/dev/null
rm -rf src/modules/hardware

mv src/modules/menu/components/* src/modules/shared/components/modals/ 2>/dev/null
rm -rf src/modules/menu

mv src/modules/order/components/PhoneOrderModal.tsx src/modules/pos/components/modals/ 2>/dev/null
mv src/modules/order/components/* src/modules/pos/components/ 2>/dev/null
mv src/modules/order/services/* src/modules/shared/services/ 2>/dev/null
mv src/modules/order/types.ts src/modules/shared/types/orderTypes.ts 2>/dev/null
rm -rf src/modules/order

mv src/modules/checkout/components/CheckoutFlowManager.tsx src/modules/pos/components/ 2>/dev/null
mv src/modules/checkout/components/CheckoutSidebar.tsx src/modules/pos/components/ 2>/dev/null
mv src/modules/checkout/store.ts src/modules/pos/store/checkoutStore.ts 2>/dev/null
rm -rf src/modules/checkout

mv src/modules/payment/components/modals/* src/modules/pos/components/modals/ 2>/dev/null
mv src/modules/payment/store.ts src/modules/shared/store/paymentStore.ts 2>/dev/null
mv src/modules/payment/types.ts src/modules/shared/types/paymentTypes.ts 2>/dev/null
rm -rf src/modules/payment

mv src/app/kiosk/components/DayWarningModal.tsx src/modules/kiosk/components/modals/ 2>/dev/null
mv src/app/kiosk/components/KioskCart.tsx src/modules/kiosk/components/ 2>/dev/null
rm -rf src/app/kiosk/components

node fix-imports.js
rm fix-imports.js refactor.sh
npm run build
