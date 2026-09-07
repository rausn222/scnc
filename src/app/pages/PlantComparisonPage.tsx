import { Fragment, useMemo, useState } from 'react';
import {
    ArrowRight, CheckCircle2, AlertTriangle, Truck, ShoppingCart,
    Star, CheckCheck, Wifi, WifiOff, Layers,
    ChevronDown, ChevronRight, Maximize2, Minimize2, Eye, EyeOff, GitCompareArrows, X,
} from 'lucide-react';

/* ───────────────────────────── DATA ───────────────────────────── */

type MatStatus = 'ok' | 'attention';

const OPTIONS = [
    {
        id: 1,
        label: 'Option 1',
        isRecommended: true,
        route: 'UTR → U535',
        score: 'excellent' as const,
        overview: {
            fgUTR: 56311, fgU535: 70214,
            wasteUTR: 2852, wasteU535: 2689,
            wasteUTRSaving: '₹2,689',
            prodPlanUTR: '58,900 EA', prodPlanU535: '2,35,294 EA',
            stopUTR: '15 Jun 2026', stopU535: '22 Jun 2026',
            planChangeUTR: true, planChangeU535: true,
        },
        iuts: [{
            from: 'UTR', to: 'U535',
            lane: 'Available' as 'Available' | 'Not set',
            materials: [
                {
                    code: 'RM 10045872', name: 'PP Granules', qty: '12,589 EA', qtyNum: 12589, leadTime: '3 days', leadDays: 3, initiation: '22 May 2026', costPerTrip: '₹300', costNum: 300, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Standard truck', qty: '12,589 EA', qtyNum: 12589, leadTime: '3 days', leadDays: 3, initiation: '22 May 2026', costPerTrip: '₹300', costNum: 300, status: 'ok' as MatStatus, selected: true },
                        { label: 'Express dispatch', qty: '12,589 EA', qtyNum: 12589, leadTime: '1 day', leadDays: 1, initiation: '24 May 2026', costPerTrip: '₹520', costNum: 520, status: 'attention' as MatStatus, note: 'Cost/trip 73% above standard' },
                        { label: 'Milk-run consolidation', qty: '12,589 EA', qtyNum: 12589, leadTime: '5 days', leadDays: 5, initiation: '20 May 2026', costPerTrip: '₹210', costNum: 210, status: 'ok' as MatStatus },
                    ]
                },
                {
                    code: 'RM 10046110', name: 'ABS Resin', qty: '6,400 EA', qtyNum: 6400, leadTime: '3 days', leadDays: 3, initiation: '24 May 2026', costPerTrip: '₹300', costNum: 300, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Standard truck', qty: '6,400 EA', qtyNum: 6400, leadTime: '3 days', leadDays: 3, initiation: '24 May 2026', costPerTrip: '₹300', costNum: 300, status: 'ok' as MatStatus, selected: true },
                        { label: 'Club with PP Granules', qty: '6,400 EA', qtyNum: 6400, leadTime: '3 days', leadDays: 3, initiation: '22 May 2026', costPerTrip: '₹180', costNum: 180, status: 'ok' as MatStatus },
                    ]
                },
                {
                    code: 'PM 64330512', name: 'Sealant Compound', qty: '2,150 EA', qtyNum: 2150, leadTime: '6 days', leadDays: 6, initiation: '19 May 2026', costPerTrip: '₹420', costNum: 420, status: 'attention' as MatStatus, note: 'Lead time exceeds 5-day SLA',
                    scenarios: [
                        { label: 'Standard truck', qty: '2,150 EA', qtyNum: 2150, leadTime: '6 days', leadDays: 6, initiation: '19 May 2026', costPerTrip: '₹420', costNum: 420, status: 'attention' as MatStatus, note: 'Lead time exceeds 5-day SLA', selected: true },
                        { label: 'Express dispatch', qty: '2,150 EA', qtyNum: 2150, leadTime: '3 days', leadDays: 3, initiation: '22 May 2026', costPerTrip: '₹640', costNum: 640, status: 'ok' as MatStatus },
                    ]
                },
                {
                    code: 'RM 10047001', name: 'Paint Additive', qty: '3,900 EA', qtyNum: 3900, leadTime: '2 days', leadDays: 2, initiation: '25 May 2026', costPerTrip: '₹280', costNum: 280, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Standard truck', qty: '3,900 EA', qtyNum: 3900, leadTime: '2 days', leadDays: 2, initiation: '25 May 2026', costPerTrip: '₹280', costNum: 280, status: 'ok' as MatStatus, selected: true },
                        { label: 'Split shipment', qty: '2 × 1,950 EA', qtyNum: 3900, leadTime: '2 days', leadDays: 2, initiation: '25 May 2026', costPerTrip: '₹320', costNum: 320, status: 'attention' as MatStatus, note: 'Two trips, higher handling' },
                    ]
                },
                {
                    code: 'PM 64330488', name: 'Adhesive Film', qty: '1,800 EA', qtyNum: 1800, leadTime: '3 days', leadDays: 3, initiation: '23 May 2026', costPerTrip: '₹300', costNum: 300, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Standard truck', qty: '1,800 EA', qtyNum: 1800, leadTime: '3 days', leadDays: 3, initiation: '23 May 2026', costPerTrip: '₹300', costNum: 300, status: 'ok' as MatStatus, selected: true },
                        { label: 'Club with Sealant Compound', qty: '1,800 EA', qtyNum: 1800, leadTime: '6 days', leadDays: 6, initiation: '19 May 2026', costPerTrip: '₹150', costNum: 150, status: 'attention' as MatStatus, note: 'Inherits 6-day lead time' },
                    ]
                },
            ],
        },
        {
            from: 'UHI', to: 'U535',
            lane: 'Available' as 'Available' | 'Not set',
            materials: [
                {
                    code: 'RM 10049230', name: 'Rubber Gasket Set', qty: '4,200 EA', qtyNum: 4200, leadTime: '4 days', leadDays: 4, initiation: '21 May 2026', costPerTrip: '₹340', costNum: 340, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Standard truck', qty: '4,200 EA', qtyNum: 4200, leadTime: '4 days', leadDays: 4, initiation: '21 May 2026', costPerTrip: '₹340', costNum: 340, status: 'ok' as MatStatus, selected: true },
                        { label: 'Express dispatch', qty: '4,200 EA', qtyNum: 4200, leadTime: '2 days', leadDays: 2, initiation: '23 May 2026', costPerTrip: '₹560', costNum: 560, status: 'attention' as MatStatus, note: 'Cost/trip 65% above standard' },
                    ]
                },
                {
                    code: 'PM 64331020', name: 'Wiring Harness Clip', qty: '9,600 EA', qtyNum: 9600, leadTime: '3 days', leadDays: 3, initiation: '22 May 2026', costPerTrip: '₹290', costNum: 290, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Standard truck', qty: '9,600 EA', qtyNum: 9600, leadTime: '3 days', leadDays: 3, initiation: '22 May 2026', costPerTrip: '₹290', costNum: 290, status: 'ok' as MatStatus, selected: true },
                        { label: 'Club with Rubber Gasket Set', qty: '9,600 EA', qtyNum: 9600, leadTime: '4 days', leadDays: 4, initiation: '21 May 2026', costPerTrip: '₹170', costNum: 170, status: 'ok' as MatStatus },
                    ]
                },
            ],
        }],
        procurement: {
            orders: [
                {
                    plant: 'U535', supplier: 'Reliance Ind.', materialCode: 'PM 64330490', name: 'Sealant Compound', orderQty: '15,000 units', orderQtyNum: 15000, moq: '5,000 units', priceUnit: 42, total: 630000, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Contracted rate', supplier: 'Reliance Ind.', orderQty: '15,000 units', orderQtyNum: 15000, moq: '5,000 units', priceUnit: 42, total: 630000, leadTime: '4 days', status: 'ok' as MatStatus, selected: true },
                        { label: 'Alternate vendor', supplier: 'Supreme Petro.', orderQty: '15,000 units', orderQtyNum: 15000, moq: '3,000 units', priceUnit: 45, total: 675000, leadTime: '3 days', status: 'ok' as MatStatus },
                        { label: 'Split order', supplier: 'Reliance + Supreme', orderQty: '15,000 units', orderQtyNum: 15000, moq: '—', priceUnit: 43, total: 648000, leadTime: '4 days', status: 'attention' as MatStatus, note: 'Two POs, higher admin effort' },
                    ]
                },
                {
                    plant: 'U535', supplier: 'Asian Paints', materialCode: 'RM 10047001', name: 'Paint Additive', orderQty: '4,000 units', orderQtyNum: 4000, moq: '2,000 units', priceUnit: 61, total: 244000, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Contracted rate', supplier: 'Asian Paints', orderQty: '4,000 units', orderQtyNum: 4000, moq: '2,000 units', priceUnit: 61, total: 244000, leadTime: '3 days', status: 'ok' as MatStatus, selected: true },
                        { label: 'Bulk discount', supplier: 'Asian Paints', orderQty: '6,000 units', orderQtyNum: 6000, moq: '2,000 units', priceUnit: 55, total: 330000, leadTime: '3 days', status: 'attention' as MatStatus, note: 'Over-stocks by 2,000 units' },
                    ]
                },
                {
                    plant: 'UTR', supplier: 'BASF India', materialCode: 'RM 10045872', name: 'PP Granules', orderQty: '10,000 units', orderQtyNum: 10000, moq: '4,000 units', priceUnit: 45, total: 450000, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Contracted rate', supplier: 'BASF India', orderQty: '10,000 units', orderQtyNum: 10000, moq: '4,000 units', priceUnit: 45, total: 450000, leadTime: '5 days', status: 'ok' as MatStatus, selected: true },
                        { label: 'Spot buy', supplier: 'LG Polymers', orderQty: '10,000 units', orderQtyNum: 10000, moq: '1,000 units', priceUnit: 48, total: 480000, leadTime: '2 days', status: 'ok' as MatStatus },
                        { label: 'Import lot', supplier: 'Sabic (import)', orderQty: '12,000 units', orderQtyNum: 12000, moq: '12,000 units', priceUnit: 40, total: 480000, leadTime: '18 days', status: 'attention' as MatStatus, note: 'Lead time misses plan window' },
                    ]
                },
                {
                    plant: 'UTR', supplier: 'Pidilite Ind.', materialCode: 'PM 64330488', name: 'Adhesive Film', orderQty: '5,000 units', orderQtyNum: 5000, moq: '5,000 units', priceUnit: 31, total: 155000, status: 'attention' as MatStatus, note: 'MOQ forces over-order: need 1,800, must buy 5,000',
                    scenarios: [
                        { label: 'Contracted rate', supplier: 'Pidilite Ind.', orderQty: '5,000 units', orderQtyNum: 5000, moq: '5,000 units', priceUnit: 31, total: 155000, leadTime: '4 days', status: 'attention' as MatStatus, note: 'MOQ over-order: need 1,800, must buy 5,000', selected: true },
                        { label: 'Low-MOQ vendor', supplier: '3M India', orderQty: '2,000 units', orderQtyNum: 2000, moq: '1,000 units', priceUnit: 39, total: 78000, leadTime: '6 days', status: 'ok' as MatStatus },
                    ]
                },
            ],
        },
        totalCost: 1080000,
    },
    {
        id: 2,
        label: 'Option 2',
        isRecommended: false,
        route: 'U535 → UTR',
        score: 'moderate' as const,
        overview: {
            fgUTR: 81489, fgU535: 237705,
            wasteUTR: 3104, wasteU535: 2437,
            wasteUTRSaving: '₹2,437',
            prodPlanUTR: '58,900 EA', prodPlanU535: '2,35,294 EA',
            stopUTR: '18 Jun 2026', stopU535: '22 Jun 2026',
            planChangeUTR: true, planChangeU535: true,
        },
        iuts: [{
            from: 'U535', to: 'UTR',
            lane: 'Available' as 'Available' | 'Not set',
            materials: [
                {
                    code: 'PM 20018734', name: 'Steel Sheet Coil', qty: '12,589 EA', qtyNum: 12589, leadTime: '2 days', leadDays: 2, initiation: '27 May 2026', costPerTrip: '₹300', costNum: 300, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Standard truck', qty: '12,589 EA', qtyNum: 12589, leadTime: '2 days', leadDays: 2, initiation: '27 May 2026', costPerTrip: '₹300', costNum: 300, status: 'ok' as MatStatus, selected: true },
                        { label: 'Rail consolidation', qty: '12,589 EA', qtyNum: 12589, leadTime: '4 days', leadDays: 4, initiation: '25 May 2026', costPerTrip: '₹190', costNum: 190, status: 'ok' as MatStatus },
                    ]
                },
                {
                    code: 'PM 20018902', name: 'Fastener Kit', qty: '8,750 EA', qtyNum: 8750, leadTime: '2 days', leadDays: 2, initiation: '28 May 2026', costPerTrip: '₹260', costNum: 260, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Standard truck', qty: '8,750 EA', qtyNum: 8750, leadTime: '2 days', leadDays: 2, initiation: '28 May 2026', costPerTrip: '₹260', costNum: 260, status: 'ok' as MatStatus, selected: true },
                        { label: 'Club with Steel Sheet Coil', qty: '8,750 EA', qtyNum: 8750, leadTime: '2 days', leadDays: 2, initiation: '27 May 2026', costPerTrip: '₹140', costNum: 140, status: 'ok' as MatStatus },
                    ]
                },
                {
                    code: 'RM 10046995', name: 'Rubber Gasket', qty: '5,200 EA', qtyNum: 5200, leadTime: '3 days', leadDays: 3, initiation: '26 May 2026', costPerTrip: '₹300', costNum: 300, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Standard truck', qty: '5,200 EA', qtyNum: 5200, leadTime: '3 days', leadDays: 3, initiation: '26 May 2026', costPerTrip: '₹300', costNum: 300, status: 'ok' as MatStatus, selected: true },
                        { label: 'Express dispatch', qty: '5,200 EA', qtyNum: 5200, leadTime: '1 day', leadDays: 1, initiation: '28 May 2026', costPerTrip: '₹480', costNum: 480, status: 'attention' as MatStatus, note: 'Cost/trip 60% above standard' },
                    ]
                },
                {
                    code: 'PM 20019110', name: 'Wiring Harness', qty: '2,400 EA', qtyNum: 2400, leadTime: '4 days', leadDays: 4, initiation: '24 May 2026', costPerTrip: '₹340', costNum: 340, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Standard truck', qty: '2,400 EA', qtyNum: 2400, leadTime: '4 days', leadDays: 4, initiation: '24 May 2026', costPerTrip: '₹340', costNum: 340, status: 'ok' as MatStatus, selected: true },
                        { label: 'Split shipment', qty: '2 × 1,200 EA', qtyNum: 2400, leadTime: '4 days', leadDays: 4, initiation: '24 May 2026', costPerTrip: '₹390', costNum: 390, status: 'attention' as MatStatus, note: 'Two trips, higher handling' },
                    ]
                },
            ],
        }],
        procurement: {
            orders: [
                {
                    plant: 'U535', supplier: 'Tata Chemicals', materialCode: 'PM 64330490', name: 'Steel Sheet Coil', orderQty: '15,000 units', orderQtyNum: 15000, moq: '3,000 units', priceUnit: 38, total: 570000, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Contracted rate', supplier: 'Tata Chemicals', orderQty: '15,000 units', orderQtyNum: 15000, moq: '3,000 units', priceUnit: 38, total: 570000, leadTime: '5 days', status: 'ok' as MatStatus, selected: true },
                        { label: 'Alternate mill', supplier: 'JSW Steel', orderQty: '15,000 units', orderQtyNum: 15000, moq: '5,000 units', priceUnit: 36, total: 540000, leadTime: '9 days', status: 'attention' as MatStatus, note: 'Longer lead time, quality re-approval needed' },
                    ]
                },
                {
                    plant: 'UTR', supplier: 'Evonik India', materialCode: 'RM 10045872', name: 'Rubber Gasket', orderQty: '10,000 units', orderQtyNum: 10000, moq: '2,000 units', priceUnit: 50, total: 500000, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Contracted rate', supplier: 'Evonik India', orderQty: '10,000 units', orderQtyNum: 10000, moq: '2,000 units', priceUnit: 50, total: 500000, leadTime: '4 days', status: 'ok' as MatStatus, selected: true },
                        { label: 'Local vendor', supplier: 'MRF Polymers', orderQty: '10,000 units', orderQtyNum: 10000, moq: '2,000 units', priceUnit: 47, total: 470000, leadTime: '3 days', status: 'ok' as MatStatus },
                        { label: 'Spot buy', supplier: 'Open market', orderQty: '10,000 units', orderQtyNum: 10000, moq: '—', priceUnit: 54, total: 540000, leadTime: '1 day', status: 'attention' as MatStatus, note: 'Price 8% above contract' },
                    ]
                },
                {
                    plant: 'UTR', supplier: 'Sundram Fast.', materialCode: 'PM 20018902', name: 'Fastener Kit', orderQty: '6,000 units', orderQtyNum: 6000, moq: '3,000 units', priceUnit: 22, total: 132000, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Contracted rate', supplier: 'Sundram Fast.', orderQty: '6,000 units', orderQtyNum: 6000, moq: '3,000 units', priceUnit: 22, total: 132000, leadTime: '3 days', status: 'ok' as MatStatus, selected: true },
                        { label: 'Annual buy', supplier: 'Sundram Fast.', orderQty: '12,000 units', orderQtyNum: 12000, moq: '3,000 units', priceUnit: 20, total: 240000, leadTime: '3 days', status: 'ok' as MatStatus },
                    ]
                },
            ],
        },
        totalCost: 1070000,
    },
    {
        id: 3,
        label: 'Option 3',
        isRecommended: false,
        route: 'UTR → U535',
        score: 'poor' as const,
        overview: {
            fgUTR: 60700, fgU535: 258494,
            wasteUTR: 3890, wasteU535: 1651,
            wasteUTRSaving: '₹1,651',
            prodPlanUTR: '58,900 EA', prodPlanU535: '2,35,294 EA',
            stopUTR: '18 Jun 2026', stopU535: '22 Jun 2026',
            planChangeUTR: true, planChangeU535: true,
        },
        iuts: [{
            from: 'UTR', to: 'U535',
            lane: 'Not set' as 'Available' | 'Not set',
            materials: [
                {
                    code: 'PM 30098721', name: 'Glass Panel', qty: '8,200 EA', qtyNum: 8200, leadTime: '4 days', leadDays: 4, initiation: '18 May 2026', costPerTrip: '₹450', costNum: 450, status: 'attention' as MatStatus, note: 'Cost/trip 50% above route average',
                    scenarios: [
                        { label: 'Standard truck (fragile-rated)', qty: '8,200 EA', qtyNum: 8200, leadTime: '4 days', leadDays: 4, initiation: '18 May 2026', costPerTrip: '₹450', costNum: 450, status: 'attention' as MatStatus, note: 'Cost/trip 50% above route average', selected: true },
                        { label: 'Dedicated carrier', qty: '8,200 EA', qtyNum: 8200, leadTime: '3 days', leadDays: 3, initiation: '19 May 2026', costPerTrip: '₹560', costNum: 560, status: 'attention' as MatStatus, note: 'Premium rate, lower breakage risk' },
                    ]
                },
                {
                    code: 'RM 10047230', name: 'Foam Padding', qty: '4,600 EA', qtyNum: 4600, leadTime: '7 days', leadDays: 7, initiation: '15 May 2026', costPerTrip: '₹380', costNum: 380, status: 'attention' as MatStatus, note: 'Qty short of plan by 1,400 EA',
                    scenarios: [
                        { label: 'Standard truck', qty: '4,600 EA', qtyNum: 4600, leadTime: '7 days', leadDays: 7, initiation: '15 May 2026', costPerTrip: '₹380', costNum: 380, status: 'attention' as MatStatus, note: 'Qty short of plan by 1,400 EA', selected: true },
                        { label: 'Two-lot transfer', qty: '4,600 + 1,400 EA', qtyNum: 6000, leadTime: '9 days', leadDays: 9, initiation: '13 May 2026', costPerTrip: '₹430', costNum: 430, status: 'attention' as MatStatus, note: 'Covers shortfall, longer window' },
                    ]
                },
                {
                    code: 'PM 30099004', name: 'Trim Clip Set', qty: '3,100 EA', qtyNum: 3100, leadTime: '3 days', leadDays: 3, initiation: '20 May 2026', costPerTrip: '₹300', costNum: 300, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Standard truck', qty: '3,100 EA', qtyNum: 3100, leadTime: '3 days', leadDays: 3, initiation: '20 May 2026', costPerTrip: '₹300', costNum: 300, status: 'ok' as MatStatus, selected: true },
                        { label: 'Club with Glass Panel', qty: '3,100 EA', qtyNum: 3100, leadTime: '4 days', leadDays: 4, initiation: '18 May 2026', costPerTrip: '₹160', costNum: 160, status: 'ok' as MatStatus },
                    ]
                },
                {
                    code: 'RM 10047555', name: 'Lubricant Drum', qty: '1,250 EA', qtyNum: 1250, leadTime: '2 days', leadDays: 2, initiation: '21 May 2026', costPerTrip: '₹290', costNum: 290, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Standard truck', qty: '1,250 EA', qtyNum: 1250, leadTime: '2 days', leadDays: 2, initiation: '21 May 2026', costPerTrip: '₹290', costNum: 290, status: 'ok' as MatStatus, selected: true },
                        { label: 'Milk-run consolidation', qty: '1,250 EA', qtyNum: 1250, leadTime: '4 days', leadDays: 4, initiation: '19 May 2026', costPerTrip: '₹180', costNum: 180, status: 'ok' as MatStatus },
                    ]
                },
            ],
        }],
        procurement: {
            orders: [
                {
                    plant: 'U535', supplier: 'Tata Chemicals', materialCode: 'PM 64330490', name: 'Glass Panel', orderQty: '15,000 units', orderQtyNum: 15000, moq: '3,000 units', priceUnit: 38, total: 570000, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Contracted rate', supplier: 'Tata Chemicals', orderQty: '15,000 units', orderQtyNum: 15000, moq: '3,000 units', priceUnit: 38, total: 570000, leadTime: '6 days', status: 'ok' as MatStatus, selected: true },
                        { label: 'Alternate vendor', supplier: 'AGC India', orderQty: '15,000 units', orderQtyNum: 15000, moq: '5,000 units', priceUnit: 41, total: 615000, leadTime: '4 days', status: 'ok' as MatStatus },
                    ]
                },
                {
                    plant: 'U535', supplier: 'Saint-Gobain', materialCode: 'RM 10047230', name: 'Foam Padding', orderQty: '3,000 units', orderQtyNum: 3000, moq: '3,000 units', priceUnit: 55, total: 165000, status: 'attention' as MatStatus, note: 'Single-source supplier · price 20% above benchmark',
                    scenarios: [
                        { label: 'Contracted rate', supplier: 'Saint-Gobain', orderQty: '3,000 units', orderQtyNum: 3000, moq: '3,000 units', priceUnit: 55, total: 165000, leadTime: '5 days', status: 'attention' as MatStatus, note: 'Single-source · price 20% above benchmark', selected: true },
                        { label: 'New vendor trial', supplier: 'Sheela Foam', orderQty: '3,000 units', orderQtyNum: 3000, moq: '1,000 units', priceUnit: 46, total: 138000, leadTime: '8 days', status: 'attention' as MatStatus, note: 'PPAP approval pending' },
                    ]
                },
                {
                    plant: 'UTR', supplier: 'Evonik India', materialCode: 'RM 10045872', name: 'Trim Clip Set', orderQty: '10,000 units', orderQtyNum: 10000, moq: '2,000 units', priceUnit: 50, total: 500000, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Contracted rate', supplier: 'Evonik India', orderQty: '10,000 units', orderQtyNum: 10000, moq: '2,000 units', priceUnit: 50, total: 500000, leadTime: '4 days', status: 'ok' as MatStatus, selected: true },
                        { label: 'Bulk discount', supplier: 'Evonik India', orderQty: '14,000 units', orderQtyNum: 14000, moq: '2,000 units', priceUnit: 46, total: 644000, leadTime: '4 days', status: 'attention' as MatStatus, note: 'Ties up working capital' },
                    ]
                },
                {
                    plant: 'UTR', supplier: 'Castrol India', materialCode: 'RM 10047555', name: 'Lubricant Drum', orderQty: '1,500 units', orderQtyNum: 1500, moq: '1,000 units', priceUnit: 88, total: 132000, status: 'ok' as MatStatus,
                    scenarios: [
                        { label: 'Contracted rate', supplier: 'Castrol India', orderQty: '1,500 units', orderQtyNum: 1500, moq: '1,000 units', priceUnit: 88, total: 132000, leadTime: '2 days', status: 'ok' as MatStatus, selected: true },
                        { label: 'Spot buy', supplier: 'Gulf Oil', orderQty: '1,500 units', orderQtyNum: 1500, moq: '500 units', priceUnit: 92, total: 138000, leadTime: '1 day', status: 'ok' as MatStatus },
                    ]
                },
            ],
        },
        totalCost: 1070000,
    },
];

type Option = typeof OPTIONS[number];
type ScoreKey = 'excellent' | 'moderate' | 'poor';

/* ── Strategy categories — each MAIN option carries its own set of these ── */
interface Strategy {
    key: string;
    name: string;
    badge?: 'Best' | 'New' | 'Base';
    icon: React.ElementType;
    showIut: boolean;
    showProc: boolean;
    costFactor: number;   // vs the option's base total cost
    days: number;
    endDate: string;
}

const STRATEGIES: Strategy[] = [
    { key: 'iut-break-moq', name: 'IUT + Break MOQ', icon: Layers, showIut: true, showProc: true, costFactor: 0.90, days: 26, endDate: '15 Jun 2026' },
    { key: 'iut-proc', name: 'IUT + Procurement', icon: Star, showIut: true, showProc: true, costFactor: 1.00, days: 25, endDate: '14 Jun 2026', badge: 'Best' },
    { key: 'iut', name: 'IUT', icon: Truck, showIut: true, showProc: false, costFactor: 1.07, days: 25, endDate: '14 Jun 2026' },
    { key: 'proc', name: 'Procurement', icon: ShoppingCart, showIut: false, showProc: true, costFactor: 1.36, days: 23, endDate: '12 Jun 2026' },
    { key: 'iut-proc-new', name: 'IUT + Procurement New', icon: Star, showIut: true, showProc: true, costFactor: 1.005, days: 25, endDate: '14 Jun 2026', badge: 'New' },
    { key: 'no-action', name: 'No Action', icon: CheckCheck, showIut: false, showProc: false, costFactor: 1.45, days: 23, endDate: '12 Jun 2026', badge: 'Base' },
];

const stratCost = (opt: Option, s: Strategy) => Math.round(opt.totalCost * s.costFactor / 1000) * 1000;
const noActionCost = (opt: Option) => stratCost(opt, STRATEGIES.find((s) => s.key === 'no-action')!);

interface IutScenario {
    label: string;
    qty: string; qtyNum: number;
    leadTime: string; leadDays: number;
    initiation: string;
    costPerTrip: string; costNum: number;
    status: MatStatus; note?: string;
    selected?: boolean;
}

interface Material {
    code: string; name: string;
    qty: string; qtyNum: number;
    leadTime: string; leadDays: number;
    initiation: string;
    costPerTrip: string; costNum: number;
    status: MatStatus; note?: string;
    scenarios: IutScenario[];
}

/* Aggregates across an option's IUT materials */
function iutAgg(iut: Option['iuts'][number]) {
    const mats = iut.materials as Material[];
    return {
        count: mats.length,
        attention: mats.filter((m) => m.status === 'attention').length,
        totalQty: mats.reduce((s, m) => s + m.qtyNum, 0),
        maxLead: Math.max(...mats.map((m) => m.leadDays)),
        totalTripCost: mats.reduce((s, m) => s + m.costNum, 0),
    };
}

/* Attention-first ordering for the material strip */
function sortedMaterials(mats: Material[]) {
    return [...mats].sort((a, b) =>
        a.status === b.status ? 0 : a.status === 'attention' ? -1 : 1,
    );
}

interface ProcScenario {
    label: string; supplier: string;
    orderQty: string; orderQtyNum: number;
    moq: string; priceUnit: number; total: number;
    leadTime: string;
    status: MatStatus; note?: string;
    selected?: boolean;
}

interface PurchaseOrder {
    plant: string; supplier: string;
    materialCode: string; name: string;
    orderQty: string; orderQtyNum: number;
    moq: string; priceUnit: number; total: number;
    status: MatStatus; note?: string;
    scenarios: ProcScenario[];
}

/* Aggregates across an option's purchase orders */
function poAgg(po: Option['procurement']) {
    const orders = po.orders as PurchaseOrder[];
    return {
        count: orders.length,
        attention: orders.filter((o) => o.status === 'attention').length,
        totalUnits: orders.reduce((s, o) => s + o.orderQtyNum, 0),
        totalValue: orders.reduce((s, o) => s + o.total, 0),
        suppliers: new Set(orders.map((o) => o.supplier)).size,
    };
}

function sortedOrders(orders: PurchaseOrder[]) {
    return [...orders].sort((a, b) =>
        a.status === b.status ? 0 : a.status === 'attention' ? -1 : 1,
    );
}

/* ───────────────────────────── ATOMS ───────────────────────────── */

function PlantBadge({ plant, sm }: { plant: string; sm?: boolean }) {
    const s: Record<string, string> = { UTR: 'bg-blue-600', U535: 'bg-indigo-600' };
    return (
        <span className={`inline-flex items-center rounded font-bold tracking-wide text-white ${sm ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'} ${s[plant] ?? 'bg-slate-600'}`}>
            {plant}
        </span>
    );
}

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

/* ─────────────────────────── FOCUS DETAIL ─────────────────────────── */

function SectionDivider({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <div className="flex items-center gap-3 py-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Icon className="w-3.5 h-3.5" /> {label}
            </div>
            <div className="flex-1 border-t border-slate-200" />
        </div>
    );
}


/* Detail for one strategy inside a main option */
function StrategyDetail({ opt, strat }: { opt: Option; strat: Strategy }) {
    return (
        <div className="flex flex-col gap-4">
            {strat.showIut && (
                <>
                    <SectionDivider icon={Truck} label="IUT Transfer" />
                    {opt.iuts.map((leg, i) => (
                        <IutSection key={`iut-${opt.id}-${strat.key}-${i}`} iut={leg} />
                    ))}
                </>
            )}

            {strat.showProc && (
                <>
                    <SectionDivider icon={ShoppingCart} label="Procurement" />
                    <ProcurementSection key={`po-${opt.id}-${strat.key}`} po={opt.procurement} />
                </>
            )}

            {!strat.showIut && !strat.showProc && (
                <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-5 py-6 text-center">
                    Baseline scenario — no IUT transfer or procurement action is taken.
                </div>
            )}

            <div className="flex items-center justify-between bg-indigo-600 text-white rounded-xl px-5 py-3.5 shadow-md">
                <span className="text-sm font-semibold">Total Cost · {strat.name}</span>
                <span className="text-lg font-bold">{fmt(stratCost(opt, strat))}</span>
            </div>
        </div>
    );
}

/* ── SELECTED PLAN — collapsible sections, contracted by default ── */
function SelectedPlanSections({ opt, strat }: { opt: Option; strat: Strategy }) {
    const [openSections, setOpenSections] = useState<Set<string>>(new Set());
    const toggle = (id: string) =>
        setOpenSections((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });

    const ViewButton = ({ id, label }: { id: string; label: string }) => {
        const isOpen = openSections.has(id);
        return (
            <button
                onClick={() => toggle(id)}
                aria-expanded={isOpen}
                aria-controls={`sel-section-${id}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors flex-none ${isOpen
                        ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-white border-indigo-300 text-indigo-600 hover:bg-indigo-50'
                    }`}
            >
                {isOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {isOpen ? 'Hide' : 'View'} {label}
            </button>
        );
    };

    return (
        <div className="flex flex-col gap-3">
            {strat.showIut && opt.iuts.map((leg, i) => {
                const id = `iut-${i}`;
                const agg = iutAgg(leg);
                const isOpen = openSections.has(id);
                return (
                    <div key={id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-2.5 flex-wrap">
                            <Truck className="w-4 h-4 text-indigo-500 flex-none" />
                            <span className="text-xs font-bold text-slate-800">IUT Transfer</span>
                            <span className="inline-flex items-center gap-1">
                                <PlantBadge plant={leg.from} sm /><ArrowRight className="w-3 h-3 text-indigo-400" /><PlantBadge plant={leg.to} sm />
                            </span>
                            <span className="text-[11px] text-slate-500">
                                <b className="text-slate-700">{agg.count}</b> materials · <b className="text-slate-700">{agg.totalQty.toLocaleString('en-IN')} EA</b>
                            </span>
                            {agg.attention > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                                    <AlertTriangle className="w-3 h-3" />{agg.attention} need attention
                                </span>
                            )}
                            <div className="ml-auto"><ViewButton id={id} label="details" /></div>
                        </div>
                        {isOpen && (
                            <div id={`sel-section-${id}`} className="border-t border-slate-200 bg-slate-50/50 p-3">
                                <IutSection iut={leg} />
                            </div>
                        )}
                    </div>
                );
            })}

            {strat.showProc && (() => {
                const id = 'proc';
                const agg = poAgg(opt.procurement);
                const isOpen = openSections.has(id);
                return (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-2.5 flex-wrap">
                            <ShoppingCart className="w-4 h-4 text-indigo-500 flex-none" />
                            <span className="text-xs font-bold text-slate-800">Procurement</span>
                            <span className="text-[11px] text-slate-500">
                                <b className="text-slate-700">{agg.count}</b> POs · <b className="text-slate-700">{agg.suppliers}</b> suppliers · <b className="text-slate-700">{fmt(agg.totalValue)}</b>
                            </span>
                            {agg.attention > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                                    <AlertTriangle className="w-3 h-3" />{agg.attention} need attention
                                </span>
                            )}
                            <div className="ml-auto"><ViewButton id={id} label="details" /></div>
                        </div>
                        {isOpen && (
                            <div id={`sel-section-${id}`} className="border-t border-slate-200 bg-slate-50/50 p-3">
                                <ProcurementSection po={opt.procurement} />
                            </div>
                        )}
                    </div>
                );
            })()}

            {!strat.showIut && !strat.showProc && (
                <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-5 py-6 text-center">
                    Baseline scenario — no IUT transfer or procurement action is taken.
                </div>
            )}

            <div className="flex items-center justify-between bg-indigo-600 text-white rounded-xl px-5 py-3 shadow-md">
                <span className="text-sm font-semibold">Total Cost · {strat.name}</span>
                <span className="text-lg font-bold">{fmt(stratCost(opt, strat))}</span>
            </div>
        </div>
    );
}

/* ─────────────────── IUT SECTION (tabular only) ─────────────────── */

function IutSection({ iut }: { iut: Option['iuts'][number] }) {
    const agg = useMemo(() => iutAgg(iut), [iut]);
    const mats = useMemo(() => sortedMaterials(iut.materials as Material[]), [iut]);
    const laneOk = iut.lane === 'Available';
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const toggle = (code: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code); else next.add(code);
            return next;
        });

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

            {/* Aggregate roll-up — the at-a-glance line */}
            <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1"><PlantBadge plant={iut.from} sm /><ArrowRight className="w-3 h-3 text-indigo-400" /><PlantBadge plant={iut.to} sm /></span>
                    <span className="font-bold text-slate-800">{agg.count} materials</span>
                    <span className="text-slate-300">·</span>
                    <span><b className="text-slate-800">{agg.totalQty.toLocaleString('en-IN')} EA</b> total</span>
                    <span className="text-slate-300">·</span>
                    <span className={`inline-flex items-center gap-1 font-bold ${laneOk ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {laneOk ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}Lane {iut.lane}
                    </span>
                </div>
                {agg.attention > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                        <AlertTriangle className="w-3 h-3" />{agg.attention} need attention
                    </span>
                )}
            </div>

            {/* All materials in one table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                            <th className="w-8" />
                            <th className="text-left px-4 py-2">Material</th>
                            <th className="text-right px-3 py-2">Transfer Qty</th>
                            <th className="text-right px-3 py-2">Lead Time</th>
                            <th className="text-left px-3 py-2">Initiation</th>
                            <th className="text-right px-4 py-2">Cost / Trip</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {mats.map((m) => {
                            const isOpen = expanded.has(m.code);
                            const panelId = `iut-scenarios-${m.code.replace(/\s/g, '-')}`;
                            return (
                                <Fragment key={m.code}>
                                    <tr
                                        onClick={() => toggle(m.code)}
                                        className={`cursor-pointer transition-colors ${m.status === 'attention' ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-slate-50'}`}
                                    >
                                        <td className="px-2 py-2.5 w-8 text-center align-middle">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggle(m.code); }}
                                                aria-expanded={isOpen}
                                                aria-controls={panelId}
                                                aria-label={`${isOpen ? 'Hide' : 'Show'} transfer scenarios for ${m.name}`}
                                                className="p-0.5 rounded hover:bg-slate-200/60 transition-colors align-middle"
                                            >
                                                {isOpen
                                                    ? <ChevronDown className="w-4 h-4 text-indigo-600" />
                                                    : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full flex-none ${m.status === 'attention' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                                                <div>
                                                    <div className="text-xs font-bold text-slate-800">{m.name}</div>
                                                    <div className="font-mono text-[10px] text-slate-500">{m.code} · <span className="text-indigo-500 font-sans font-semibold">{m.scenarios.length} scenarios</span></div>
                                                </div>
                                            </div>
                                            {m.status === 'attention' && m.note && (
                                                <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 mt-1">
                                                    <AlertTriangle className="w-3 h-3 flex-none" />{m.note}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 text-xs font-bold text-slate-800 text-right whitespace-nowrap">{m.qty}</td>
                                        <td className="px-3 py-2.5 text-xs text-slate-600 text-right whitespace-nowrap">{m.leadTime}</td>
                                        <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">{m.initiation}</td>
                                        <td className="px-4 py-2.5 text-xs text-slate-600 text-right whitespace-nowrap">{m.costPerTrip}</td>
                                    </tr>
                                    {isOpen && (
                                        <tr className="bg-indigo-50/40">
                                            <td />
                                            <td colSpan={5} className="px-3 pb-3 pt-1">
                                                <div id={panelId} className="rounded-lg border border-indigo-100 bg-white overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/60">
                                                                <th className="text-left px-3 py-1.5">Scenario</th>
                                                                <th className="text-right px-3 py-1.5">Transfer Qty</th>
                                                                <th className="text-right px-3 py-1.5">Lead Time</th>
                                                                <th className="text-left px-3 py-1.5">Initiation</th>
                                                                <th className="text-right px-3 py-1.5">Cost / Trip</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {m.scenarios.map((s) => (
                                                                <tr key={s.label} className={s.selected ? 'bg-emerald-50/50' : ''}>
                                                                    <td className="px-3 py-2">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-xs font-bold text-slate-800">{s.label}</span>
                                                                            {s.selected && (
                                                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">Selected</span>
                                                                            )}
                                                                        </div>
                                                                        {s.note && (
                                                                            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 mt-0.5">
                                                                                <AlertTriangle className="w-3 h-3 flex-none" />{s.note}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-xs text-slate-700 text-right whitespace-nowrap">{s.qty}</td>
                                                                    <td className="px-3 py-2 text-xs text-slate-600 text-right whitespace-nowrap">{s.leadTime}</td>
                                                                    <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">{s.initiation}</td>
                                                                    <td className="px-3 py-2 text-xs font-bold text-slate-800 text-right whitespace-nowrap">{s.costPerTrip}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50 border-t-2 border-slate-200">
                            <td />
                            <td className="px-4 py-3 text-xs font-bold text-slate-800 uppercase tracking-wider">Total · {agg.count} materials</td>
                            <td className="px-3 py-3 text-xs font-bold text-slate-800 text-right whitespace-nowrap">{agg.totalQty.toLocaleString('en-IN')} EA</td>
                            <td className="px-3 py-3 text-xs text-slate-600 text-right whitespace-nowrap">max {agg.maxLead} days</td>
                            <td />
                            <td className="px-4 py-3 text-xs font-bold text-indigo-700 text-right whitespace-nowrap">{fmt(agg.totalTripCost)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

/* ────────────── PROCUREMENT SECTION (single estimation view) ────────────── */

function ProcurementSection({ po }: { po: Option['procurement'] }) {
    const agg = useMemo(() => poAgg(po), [po]);
    const orders = useMemo(() => sortedOrders(po.orders as PurchaseOrder[]), [po]);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const toggle = (code: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code); else next.add(code);
            return next;
        });

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

            {/* Estimation roll-up across all raw materials */}
            <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                    <span className="font-bold text-slate-800">{agg.count} purchase orders</span>
                    <span className="text-slate-300">·</span>
                    <span><b className="text-slate-800">{agg.suppliers} suppliers</b></span>
                    <span className="text-slate-300">·</span>
                    <span><b className="text-slate-800">{agg.totalUnits.toLocaleString('en-IN')} units</b></span>
                </div>
                {agg.attention > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                        <AlertTriangle className="w-3 h-3" />{agg.attention} need attention
                    </span>
                )}
            </div>

            {/* All raw materials in one table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                            <th className="w-8 px-2 py-2" />
                            <th className="text-left px-2 py-2">Material</th>
                            <th className="text-left px-3 py-2">Plant</th>
                            <th className="text-left px-3 py-2">Supplier</th>
                            <th className="text-right px-3 py-2">Order Qty</th>
                            <th className="text-right px-3 py-2">MOQ</th>
                            <th className="text-right px-3 py-2">Price/Unit</th>
                            <th className="text-right px-4 py-2">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orders.map((o) => {
                            const isOpen = expanded.has(o.materialCode);
                            return (
                                <Fragment key={o.materialCode}>
                                    <tr
                                        onClick={() => toggle(o.materialCode)}
                                        className={`cursor-pointer transition-colors ${isOpen ? 'bg-indigo-50/60' : o.status === 'attention' ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <td className="px-2 py-2.5 w-8 text-center align-middle">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggle(o.materialCode); }}
                                                aria-expanded={isOpen}
                                                aria-controls={`scenarios-${o.materialCode.replace(/\s/g, '-')}`}
                                                aria-label={`${isOpen ? 'Hide' : 'Show'} procurement scenarios for ${o.name}`}
                                                className="p-0.5 rounded hover:bg-slate-200/60 transition-colors align-middle"
                                            >
                                                {isOpen
                                                    ? <ChevronDown className="w-4 h-4 text-indigo-600" />
                                                    : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                            </button>
                                        </td>
                                        <td className="px-2 py-2.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full flex-none ${o.status === 'attention' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                                                <div>
                                                    <div className="text-xs font-bold text-slate-800">{o.name}</div>
                                                    <div className="font-mono text-[10px] text-slate-500">{o.materialCode}</div>
                                                </div>
                                            </div>
                                            {o.status === 'attention' && o.note && (
                                                <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 mt-1">
                                                    <AlertTriangle className="w-3 h-3 flex-none" />{o.note}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5"><PlantBadge plant={o.plant} sm /></td>
                                        <td className="px-3 py-2.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
                                            {o.supplier}
                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{o.scenarios.length} scenarios</span>
                                        </td>
                                        <td className="px-3 py-2.5 text-xs font-bold text-slate-800 text-right whitespace-nowrap">{o.orderQty}</td>
                                        <td className="px-3 py-2.5 text-xs text-slate-600 text-right whitespace-nowrap">{o.moq}</td>
                                        <td className="px-3 py-2.5 text-xs text-slate-600 text-right whitespace-nowrap">₹{o.priceUnit}</td>
                                        <td className="px-4 py-2.5 text-xs font-bold text-indigo-700 text-right whitespace-nowrap">{fmt(o.total)}</td>
                                    </tr>

                                    {/* Nested scenario table */}
                                    {isOpen && (
                                        <tr className="bg-indigo-50/40">
                                            <td />
                                            <td colSpan={7} className="px-3 pb-3 pt-1">
                                                <div id={`scenarios-${o.materialCode.replace(/\s/g, '-')}`} className="rounded-lg border border-indigo-100 bg-white overflow-hidden">
                                                    <div className="px-3 py-2 bg-indigo-50/70 border-b border-indigo-100 text-[9px] font-bold uppercase tracking-widest text-indigo-500">
                                                        Procurement scenarios · {o.name}
                                                    </div>
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                                                <th className="text-left px-3 py-1.5">Scenario</th>
                                                                <th className="text-left px-3 py-1.5">Supplier</th>
                                                                <th className="text-right px-3 py-1.5">Order Qty</th>
                                                                <th className="text-right px-3 py-1.5">MOQ</th>
                                                                <th className="text-right px-3 py-1.5">Price/Unit</th>
                                                                <th className="text-right px-3 py-1.5">Lead Time</th>
                                                                <th className="text-right px-3 py-1.5">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {o.scenarios.map((s) => (
                                                                <tr key={s.label} className={s.selected ? 'bg-emerald-50/60' : s.status === 'attention' ? 'bg-amber-50/50' : ''}>
                                                                    <td className="px-3 py-2">
                                                                        <div className="flex items-center gap-1.5">
                                                                            {s.selected
                                                                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-none" />
                                                                                : <span className={`w-1.5 h-1.5 rounded-full flex-none ${s.status === 'attention' ? 'bg-amber-400' : 'bg-slate-300'}`} />}
                                                                            <span className={`text-xs font-bold ${s.selected ? 'text-emerald-800' : 'text-slate-700'}`}>{s.label}</span>
                                                                            {s.selected && (
                                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">SELECTED</span>
                                                                            )}
                                                                        </div>
                                                                        {s.note && (
                                                                            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 mt-0.5 ml-5">
                                                                                <AlertTriangle className="w-3 h-3 flex-none" />{s.note}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap">{s.supplier}</td>
                                                                    <td className="px-3 py-2 text-xs text-slate-700 text-right whitespace-nowrap">{s.orderQty}</td>
                                                                    <td className="px-3 py-2 text-xs text-slate-600 text-right whitespace-nowrap">{s.moq}</td>
                                                                    <td className="px-3 py-2 text-xs text-slate-600 text-right whitespace-nowrap">₹{s.priceUnit}</td>
                                                                    <td className="px-3 py-2 text-xs text-slate-600 text-right whitespace-nowrap">{s.leadTime}</td>
                                                                    <td className={`px-3 py-2 text-xs font-bold text-right whitespace-nowrap ${s.selected ? 'text-emerald-700' : 'text-slate-800'}`}>{fmt(s.total)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50 border-t-2 border-slate-200">
                            <td colSpan={4} className="px-4 py-3 text-xs font-bold text-slate-800 uppercase tracking-wider">Estimated Total · selected scenarios</td>
                            <td className="px-3 py-3 text-xs font-bold text-slate-800 text-right whitespace-nowrap">{agg.totalUnits.toLocaleString('en-IN')} units</td>
                            <td colSpan={2} />
                            <td className="px-4 py-3 text-sm font-bold text-indigo-700 text-right whitespace-nowrap">{fmt(agg.totalValue)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

function ScenarioComparison({
    comparedPairs, onRemove,
}: { comparedPairs: string[]; onRemove: (pair: string) => void }) {
    const [open, setOpen] = useState(true);
    const plans = comparedPairs
        .map((pair) => {
            const [optIdStr, ...rest] = pair.split(':');
            const opt = OPTIONS.find((o) => o.id === Number(optIdStr));
            const strat = STRATEGIES.find((s) => s.key === rest.join(':'));
            return opt && strat ? { pair, opt, strat, label: `${opt.label} · ${strat.name}` } : null;
        })
        .filter((p): p is { pair: string; opt: Option; strat: Strategy; label: string } => Boolean(p));

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Panel header */}
            <div
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
            >
                <GitCompareArrows className="w-4 h-4 text-indigo-600 flex-none" />
                <span className="text-sm font-bold text-slate-800">Scenario Comparison</span>
                <span className="text-[11px] text-slate-400">component-level numbers · {plans.length} scenarios</span>
                <div className="ml-auto flex items-center gap-2 flex-wrap">
                    {plans.map((p) => (
                        <span key={p.pair} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                            {p.label}
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(p.pair); }}
                                aria-label={`Remove ${p.label} from comparison`}
                                className="p-0.5 rounded-full hover:bg-indigo-100"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    <button
                        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                        aria-expanded={open}
                        aria-controls="scenario-comparison-panel"
                        aria-label={`${open ? 'Collapse' : 'Expand'} scenario comparison`}
                        className="p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
                    >
                        {open
                            ? <ChevronDown className="w-4 h-4 text-indigo-600" />
                            : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </button>
                </div>
            </div>

            {open && (
                <div id="scenario-comparison-panel" className="border-t border-slate-200">
                    {plans.length < 2 ? (
                        <div className="px-5 py-8 text-center text-sm text-slate-500">
                            Tick <b>Compare</b> on at least 2 scenario cells in the table above — any strategy from any option — to see components side by side.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 bg-slate-50/60">
                                        <th className="text-left px-4 py-2 align-bottom" rowSpan={2}>Component</th>
                                        <th className="text-right px-3 py-2 align-bottom" rowSpan={2}>On-hand</th>
                                        <th className="text-right px-3 py-2 align-bottom" rowSpan={2}>Open PO</th>
                                        <th className="text-right px-3 py-2 align-bottom" rowSpan={2}>Unit Price</th>
                                        {plans.map((p) => (
                                            <th key={p.pair} colSpan={2} className="text-center px-3 py-2 border-l border-slate-200 text-indigo-500">
                                                {p.label}
                                            </th>
                                        ))}
                                    </tr>
                                    <tr className="text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 bg-slate-50/60">
                                        {plans.map((p) => (
                                            <Fragment key={p.pair}>
                                                <th className="text-right px-3 py-1.5 border-l border-slate-200">Producible FG</th>
                                                <th className="text-right px-3 py-1.5">Leftover RM+PM</th>
                                            </Fragment>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {COMPARISON_DATA.map((group) => (
                                        <Fragment key={group.plant}>
                                            <tr className="bg-slate-100/80 border-y border-slate-200">
                                                <td colSpan={4 + plans.length * 2} className="px-4 py-1.5">
                                                    <span className="inline-flex items-center gap-2">
                                                        <PlantBadge plant={group.plant} sm />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{group.plant} Plant · {group.components.length} components</span>
                                                    </span>
                                                </td>
                                            </tr>
                                            {group.components.map((c) => (
                                                <tr key={c.code} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-2.5">
                                                        <div className="text-xs font-bold text-slate-800">{c.name}</div>
                                                        <div className="font-mono text-[10px] text-slate-500">{c.code}</div>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-xs text-slate-700 text-right whitespace-nowrap">{c.onHand.toLocaleString('en-IN')} EA</td>
                                                    <td className="px-3 py-2.5 text-xs text-slate-700 text-right whitespace-nowrap">{c.openPO > 0 ? `${c.openPO.toLocaleString('en-IN')} EA` : '—'}</td>
                                                    <td className="px-3 py-2.5 text-xs text-slate-700 text-right whitespace-nowrap">₹{c.unitPrice}</td>
                                                    {plans.map((p) => {
                                                        const f = c.byPlan[p.pair];
                                                        return (
                                                            <Fragment key={p.pair}>
                                                                <td className="px-3 py-2.5 text-right whitespace-nowrap border-l border-slate-100">
                                                                    <div className="text-xs font-bold text-indigo-700">{f.producibleFG.toLocaleString('en-IN')}</div>
                                                                    <div className="text-[10px] text-slate-400">prod end {f.prodEnd}</div>
                                                                </td>
                                                                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                                                    <div className={`text-xs font-bold ${f.leftover > 3000 ? 'text-amber-600' : 'text-slate-700'}`}>{f.leftover.toLocaleString('en-IN')} EA</div>
                                                                    <div className="text-[10px] text-slate-400">≈ {fmt(f.leftover * c.unitPrice)}</div>
                                                                </td>
                                                            </Fragment>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
const BADGE_STYLE: Record<NonNullable<Strategy['badge']>, string> = {
    Best: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    New: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    Base: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function PlanComparisonPage() {
    /* the single selected variant: one option + one strategy */
    const [selected, setSelected] = useState<{ optId: number; stratKey: string }>({ optId: 1, stratKey: 'iut-proc' });
    /* strategy-cell expansion ("optId:stratKey") */
    const [openStrats, setOpenStrats] = useState<Set<string>>(new Set());
    /* option columns expand/contract */
    const [expandedOpts, setExpandedOpts] = useState<Set<number>>(new Set([1, 2, 3]));
    /* collapsible table sections */
    const [showStrategies, setShowStrategies] = useState(true);
    /* per-option Summary block expand/collapse (in the comparison table's column headers) */
    const [expandedSummaries, setExpandedSummaries] = useState<Set<number>>(new Set());
    const toggleSummary = (id: number) =>
        setExpandedSummaries((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });

    const toggleStrat = (id: string) =>
        setOpenStrats((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    const toggleOpt = (id: number) =>
        setExpandedOpts((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });

    const visibleOpts = OPTIONS;

    /* Scenarios (option + strategy pairs, "optId:stratKey") picked for comparison */
    const [comparePairs, setComparePairs] = useState<string[]>(['1:iut-proc', '2:iut-proc']);
    const toggleComparePair = (pair: string) =>
        setComparePairs((prev) =>
            prev.includes(pair) ? prev.filter((k) => k !== pair) : [...prev, pair],
        );

    const selOpt = OPTIONS.find((o) => o.id === selected.optId)!;
    const selStratG = STRATEGIES.find((s) => s.key === selected.stratKey)!;
    const selCostG = stratCost(selOpt, selStratG);
    const selSavingG = selStratG.key === 'no-action' ? null : noActionCost(selOpt) - selCostG;

    return (
        <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 pb-16 flex flex-col gap-5">

            {/* ── PAGE HEADER ── */}
            <div>
                <h1 className="text-xl font-bold text-slate-900">Plan Comparison</h1>
                <p className="text-sm text-slate-500 mt-0.5">Your selected plan's details are shown first · pick any strategy from any option below · tick Compare on any cells to contrast scenarios</p>
            </div>

            {/* ── SELECTED VARIANT DETAILS ── */}
            <div className="bg-white rounded-2xl border border-emerald-300 ring-1 ring-emerald-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50/60 border-b border-emerald-200 flex-wrap">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-none" />
                    <span className="text-sm font-bold text-slate-900">Selected Plan · {selOpt.label} — {selStratG.name}</span>
                    {selStratG.badge && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${BADGE_STYLE[selStratG.badge]}`}>
                            {selStratG.badge}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-x-2 gap-y-1 flex-wrap">
                        {selOpt.iuts.map((leg, i) => (
                            <span key={i} className="inline-flex items-center gap-1">
                                <PlantBadge plant={leg.from} sm /><ArrowRight className="w-3 h-3 text-indigo-400" /><PlantBadge plant={leg.to} sm />
                            </span>
                        ))}
                    </span>
                    <div className="ml-auto flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm font-bold text-slate-900">{fmt(selCostG)}</div>
                            {selSavingG !== null
                                ? <div className="text-[10px] font-semibold text-emerald-600">↓ {fmt(selSavingG)} vs No Action</div>
                                : <div className="text-[10px] font-semibold text-slate-400">baseline</div>}
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-slate-800">{selStratG.days}d</div>
                            <div className="text-[10px] text-slate-400">till {selStratG.endDate}</div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50/40">
                    <SelectedPlanSections key={`${selected.optId}:${selected.stratKey}`} opt={selOpt} strat={selStratG} />
                </div>
            </div>

            {/* ── COMPARISON TABLE — options side by side ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-slate-200">
                            <th className="text-left px-4 py-3 align-bottom w-52">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Strategy</span>
                            </th>
                            {visibleOpts.map((opt) => {
                                const isExpanded = expandedOpts.has(opt.id);
                                const isSelOpt = selected.optId === opt.id;
                                if (!isExpanded) {
                                    return (
                                        <th key={opt.id} className="px-2 py-3 text-left align-top w-24 bg-slate-50/80">
                                            <button
                                                onClick={() => toggleOpt(opt.id)}
                                                aria-expanded={false}
                                                aria-label={`Expand ${opt.label}`}
                                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                                                title={`Expand ${opt.label}`}
                                            >
                                                <Maximize2 className="w-3.5 h-3.5" />{opt.label}
                                            </button>
                                        </th>
                                    );
                                }
                                return (
                                    <th key={opt.id} className="px-4 py-3 text-left align-top">
                                        <div className="flex items-start gap-2.5">
                                            <div>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-sm font-bold text-slate-900">{opt.label}</span>
                                                    {opt.isRecommended && (
                                                        <span className="inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider">
                                                            <Star className="w-2.5 h-2.5 fill-current" />Rec
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-x-2 gap-y-1 mt-1 flex-wrap">
                                                    {opt.iuts.map((leg, i) => (
                                                        <span key={i} className="inline-flex items-center gap-1">
                                                            <PlantBadge plant={leg.from} sm /><ArrowRight className="w-3 h-3 text-indigo-400" /><PlantBadge plant={leg.to} sm />
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="text-xs font-bold text-slate-700 mt-1">{fmt(opt.totalCost)}<span className="font-normal text-slate-400 text-[10px]"> base</span></div>

                                                {/* Summary — Business Waste + FG producible totals, expandable to per-plant stop dates */}
                                                {(() => {
                                                    const totalFg = opt.overview.fgUTR + opt.overview.fgU535;
                                                    const totalWaste = opt.overview.wasteUTR + opt.overview.wasteU535;
                                                    const isSummaryOpen = expandedSummaries.has(opt.id);
                                                    return (
                                                        <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-1.5">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggleSummary(opt.id); }}
                                                                aria-expanded={isSummaryOpen}
                                                                aria-controls={`summary-${opt.id}`}
                                                                className="w-full flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-colors"
                                                            >
                                                                {isSummaryOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                                Summary
                                                            </button>
                                                            <div className="text-[10px] mt-0.5">
                                                                <span className="font-bold text-slate-800">BW {fmt(totalWaste)}</span>
                                                                <span className="text-slate-300 mx-1">·</span>
                                                                <span className="font-bold text-slate-800">FG {totalFg.toLocaleString('en-IN')}</span>
                                                            </div>
                                                            {isSummaryOpen && (
                                                                <div id={`summary-${opt.id}`} className="mt-1 pt-1 border-t border-slate-200 flex flex-col gap-1">
                                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                                                        <PlantBadge plant="UTR" sm />Stop <span className="font-bold text-slate-800">{opt.overview.stopUTR}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                                                        <PlantBadge plant="U535" sm />Stop <span className="font-bold text-slate-800">{opt.overview.stopU535}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                {/* Selected marker — only on the option holding the selection */}
                                                {isSelOpt && (
                                                    <div className="mt-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1">
                                                        <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                                                            <CheckCircle2 className="w-3 h-3" />Selected · {selStratG.name}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-slate-800 mt-0.5">
                                                            {fmt(selCostG)}
                                                            {selSavingG !== null && <span className="font-semibold text-emerald-600"> · ↓ {fmt(selSavingG)}</span>}
                                                            <span className="font-normal text-slate-400"> · {selStratG.days}d</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => toggleOpt(opt.id)}
                                                aria-expanded={true}
                                                aria-label={`Contract ${opt.label}`}
                                                title={`Contract ${opt.label}`}
                                                className="ml-auto p-1 rounded-lg hover:bg-slate-200/60 transition-colors flex-none"
                                            >
                                                <Minimize2 className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600" />
                                            </button>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>

                        {/* Empty state when no options are selected for comparison */}
                        {visibleOpts.length === 0 && (
                            <tr>
                                <td colSpan={1} className="px-4 py-8 text-center text-xs text-slate-400 font-semibold">
                                    Select at least one option above to compare.
                                </td>
                            </tr>
                        )}

                        {/* ── STRATEGY ROWS ── */}
                        <tr
                            onClick={() => setShowStrategies((v) => !v)}
                            className="bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                            <td colSpan={1 + visibleOpts.length} className="px-4 py-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowStrategies((v) => !v); }}
                                    aria-expanded={showStrategies}
                                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    {showStrategies ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    <Layers className="w-3.5 h-3.5" />Strategies — pick one per option · expand for details
                                </button>
                            </td>
                        </tr>
                        {showStrategies && STRATEGIES.map((strat) => {
                            const Icon = strat.icon;
                            const openOpts = visibleOpts.filter((o) => openStrats.has(`${o.id}:${strat.key}`));
                            return (
                                <Fragment key={strat.key}>
                                    <tr className="border-b border-slate-100">
                                        {/* Strategy label — leftmost */}
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-4 h-4 text-slate-400 flex-none" />
                                                <span className="text-xs font-bold text-slate-800">{strat.name}</span>
                                                {strat.badge && (
                                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${BADGE_STYLE[strat.badge]}`}>
                                                        {strat.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1 ml-6">{strat.days}d · till {strat.endDate}</div>
                                        </td>

                                        {/* One cell per option */}
                                        {visibleOpts.map((opt) => {
                                            const stratId = `${opt.id}:${strat.key}`;
                                            const sSelected = selected.optId === opt.id && selected.stratKey === strat.key;
                                            const sOpen = openStrats.has(stratId);
                                            const cost = stratCost(opt, strat);
                                            const saving = strat.key === 'no-action' ? null : noActionCost(opt) - cost;
                                            if (!expandedOpts.has(opt.id)) {
                                                return <td key={opt.id} className="px-2 py-3 bg-slate-50/80" />;
                                            }
                                            return (
                                                <td
                                                    key={opt.id}
                                                    onClick={() => toggleStrat(stratId)}
                                                    className={`px-4 py-3 align-top cursor-pointer transition-colors ${sSelected ? 'bg-emerald-50/60 hover:bg-emerald-50' : 'hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelected({ optId: opt.id, stratKey: strat.key }); }}
                                                            aria-pressed={sSelected}
                                                            aria-label={`Select ${strat.name} from ${opt.label} as the plan`}
                                                            className="flex-none mt-0.5"
                                                        >
                                                            <span className={`block w-4 h-4 rounded-full border-2 transition-colors ${sSelected ? 'border-emerald-600 bg-emerald-600 shadow-[inset_0_0_0_2.5px_white]' : 'border-slate-300 bg-white hover:border-indigo-400'
                                                                }`} />
                                                        </button>
                                                        <div className="min-w-0">
                                                            <div className={`text-xs font-bold ${saving === null ? 'text-red-500' : 'text-slate-900'}`}>{fmt(cost)}</div>
                                                            {saving !== null
                                                                ? <div className="text-[9px] font-semibold text-emerald-600">↓ {fmt(saving)}</div>
                                                                : <div className="text-[9px] font-semibold text-slate-400">baseline</div>}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggleStrat(stratId); }}
                                                                aria-expanded={sOpen}
                                                                aria-controls={`strat-detail-${opt.id}-${strat.key}`}
                                                                aria-label={`${sOpen ? 'Collapse' : 'Expand'} ${strat.name} details for ${opt.label}`}
                                                                className={`inline-flex items-center gap-0.5 mt-1 text-[10px] font-bold rounded transition-colors ${sOpen ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
                                                            >
                                                                {sOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                                {sOpen ? 'Hide details' : 'More details'}
                                                            </button>
                                                            <label
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="mt-1 flex items-center gap-1 cursor-pointer select-none text-[10px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={comparePairs.includes(stratId)}
                                                                    onChange={() => toggleComparePair(stratId)}
                                                                    aria-label={`Compare ${strat.name} from ${opt.label}`}
                                                                    className="w-3 h-3 rounded border-slate-300 accent-indigo-600"
                                                                />
                                                                Compare
                                                            </label>
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>

                                    {/* Expanded details — one full-width block per open option */}
                                    {openOpts.filter((o) => expandedOpts.has(o.id)).map((opt) => (
                                        <tr key={`detail-${opt.id}`} className="border-b border-slate-100 bg-slate-50/60">
                                            <td colSpan={1 + visibleOpts.length} className="px-4 py-3">
                                                <div id={`strat-detail-${opt.id}-${strat.key}`} className="flex flex-col gap-3">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                                                        <Icon className="w-3.5 h-3.5" />{opt.label} · {strat.name}
                                                    </div>
                                                    <StrategyDetail opt={opt} strat={strat} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── SCENARIO COMPARISON ── */}
            <ScenarioComparison
                comparedPairs={comparePairs}
                onRemove={(pair) => setComparePairs((prev) => prev.filter((k) => k !== pair))}
            />

            {/* Legend */}
            <div className="text-[11px] text-slate-400 text-center">
                ↓ Savings vs No Action baseline &nbsp;·&nbsp;
                <span className="text-emerald-600 font-semibold">≥40% Excellent</span> &nbsp;·&nbsp;
                <span className="text-amber-500 font-semibold">20–39% Moderate</span> &nbsp;·&nbsp;
                <span className="text-red-500 font-semibold">&lt;20% Poor</span>
            </div>
        </div>
    );
}

interface CompPlantGroup {
    plant: string;
    components: CompComponent[];
}

interface CompPlanFigures {
    producibleFG: number;
    prodEnd: string;
    leftover: number;
}

interface CompComponent {
    code: string;
    name: string;
    kind: 'RM' | 'PM';
    onHand: number;
    openPO: number;
    unitPrice: number;
    /** Keyed "optionId:strategyKey" — matches the `pair` used elsewhere on this page. */
    byPlan: Record<string, CompPlanFigures>;
}

/* producibleFG scales with each strategy's execution efficiency relative to
   'iut-proc' (the recommended baseline) — ratios derived from the original
   demo figures, which held steady across components. */
const FG_STRATEGY_RATIO: Record<string, number> = {
    'iut-break-moq': 1.000,
    'iut-proc': 1.000,
    'iut': 0.876,
    'proc': 0.828,
    'iut-proc-new': 0.990,
    'no-action': 0.745,
};

const PROD_END_BY_STRATEGY: Record<string, string> = {
    'iut-break-moq': '15 Jun 2026',
    'iut-proc': '14 Jun 2026',
    'iut': '14 Jun 2026',
    'proc': '12 Jun 2026',
    'iut-proc-new': '14 Jun 2026',
    'no-action': '12 Jun 2026',
};

/* Builds byPlan for one component, keyed "optionId:strategyKey" so every
   option gets its own numbers instead of colliding on strategy key alone.
   producibleFG is anchored to that option's own Overview FG for the plant
   (componentFactor models a per-component bottleneck below the plant ceiling);
   leftover reflects fixed on-hand/open-PO stock, so it's shared across options. */
function buildComponentByPlan(
    plantKey: 'fgUTR' | 'fgU535',
    componentFactor: number,
    leftoverByStrategy: Record<string, number>,
): Record<string, CompPlanFigures> {
    const out: Record<string, CompPlanFigures> = {};
    for (const opt of OPTIONS) {
        const anchor = opt.overview[plantKey];
        for (const stratKey of Object.keys(FG_STRATEGY_RATIO)) {
            out[`${opt.id}:${stratKey}`] = {
                producibleFG: Math.round(anchor * componentFactor * FG_STRATEGY_RATIO[stratKey]),
                prodEnd: PROD_END_BY_STRATEGY[stratKey],
                leftover: leftoverByStrategy[stratKey],
            };
        }
    }
    return out;
}

/* Hardcoded demo data, consistent with the rest of the page. */
const COMPARISON_DATA: CompPlantGroup[] = [
    {
        plant: 'U535',
        components: [
            {
                code: 'RM 10045872', name: 'PP Granules', kind: 'RM', onHand: 18400, openPO: 10000, unitPrice: 45,
                byPlan: buildComponentByPlan('fgU535', 1.000, {
                    'iut-break-moq': 1240, 'iut-proc': 980, 'iut': 3420, 'proc': 4210, 'iut-proc-new': 1105, 'no-action': 6890,
                }),
            },
            {
                code: 'PM 64330490', name: 'Sealant Compound', kind: 'PM', onHand: 6200, openPO: 15000, unitPrice: 42,
                byPlan: buildComponentByPlan('fgU535', 0.982, {
                    'iut-break-moq': 860, 'iut-proc': 640, 'iut': 2980, 'proc': 3550, 'iut-proc-new': 720, 'no-action': 5940,
                }),
            },
            {
                code: 'RM 10047001', name: 'Paint Additive', kind: 'RM', onHand: 2900, openPO: 4000, unitPrice: 61,
                byPlan: buildComponentByPlan('fgU535', 1.000, {
                    'iut-break-moq': 310, 'iut-proc': 260, 'iut': 1140, 'proc': 1420, 'iut-proc-new': 295, 'no-action': 2350,
                }),
            },
        ],
    },
    {
        plant: 'UTR',
        components: [
            {
                code: 'PM 64330488', name: 'Adhesive Film', kind: 'PM', onHand: 950, openPO: 5000, unitPrice: 31,
                byPlan: buildComponentByPlan('fgUTR', 1.000, {
                    'iut-break-moq': 480, 'iut-proc': 390, 'iut': 1730, 'proc': 2140, 'iut-proc-new': 430, 'no-action': 3670,
                }),
            },
            {
                code: 'RM 10046110', name: 'ABS Resin', kind: 'RM', onHand: 4100, openPO: 0, unitPrice: 58,
                byPlan: buildComponentByPlan('fgUTR', 0.992, {
                    'iut-break-moq': 720, 'iut-proc': 610, 'iut': 2260, 'proc': 2810, 'iut-proc-new': 665, 'no-action': 4520,
                }),
            },
            {
                code: 'PM 20018902', name: 'Fastener Kit', kind: 'PM', onHand: 12750, openPO: 6000, unitPrice: 22,
                byPlan: buildComponentByPlan('fgUTR', 1.000, {
                    'iut-break-moq': 1980, 'iut-proc': 1740, 'iut': 4380, 'proc': 5120, 'iut-proc-new': 1860, 'no-action': 7830,
                }),
            },
        ],
    },
];