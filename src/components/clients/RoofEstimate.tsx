import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, or, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { RoofEstimateTable } from './RoofEstimateTable';
import { RoofEstimateData } from '../../types/estimate';
import { Product } from '../../types/product';
import { prepareEstimateForSave } from '../../utils/estimateUtils';

interface RoofEstimateProps {
  isEditing: boolean;
  clientId: string;
}

export const RoofEstimate: React.FC<RoofEstimateProps> = ({
  isEditing,
  clientId
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [estimateData, setEstimateData] = useState<RoofEstimateData>({
    items: [
      { name: 'Брус 40x140x6000', unit: 'шт', quantity: 15, price: 3800, total: 57000 },
      { name: 'Брус 25x100x6000 (Для обрешетки)', unit: 'шт', quantity: 15, price: 1700, total: 25500 },
      { name: 'Металлочерепица глянец (Сырье Россия) (Форм СуперМонтеррей толщ. 0,45мм)', unit: 'м2', quantity: 0, price: 3006, total: 0 },
      { name: 'Паро. пленка (Под обрешетку) и (Для обшивки потолок 2эт.)', unit: 'рул', quantity: 0, price: 7000, total: 0 },
      { name: 'Конек бочкообразный (Для металлочерепицы двухметровый)', unit: 'шт', quantity: 0, price: 2970, total: 0 },
      { name: 'Заглушка конусная (Для бочкообразного конька)', unit: 'шт', quantity: 0, price: 2200, total: 0 },
      { name: 'Тройник (Для стыков бочкообразных коньков)', unit: 'шт', quantity: 0, price: 2680, total: 0 },
      { name: 'Ендова внешняя 80x80мм (Для металлочерепицы двухметровая)', unit: 'шт', quantity: 0, price: 2754, total: 0 },
      { name: 'Ендова внутренняя 600x600мм (Под металлочереп 600x600 двухметровая)', unit: 'шт', quantity: 0, price: 11166, total: 0 },
      { name: 'Планка примыкания к стене 150x150мм (В местах примык. мет. чер. к стене)', unit: 'шт', quantity: 0, price: 2816, total: 0 },
      { name: 'Пенополистирол Толщ 150мм (Для Утепления пот. 2-го эт)', unit: 'лист', quantity: 0, price: 8640, total: 0 },
      { name: 'Гвозди 120', unit: 'кг', quantity: 2, price: 700, total: 1575 },
      { name: 'Гвозди 70 (Для монтажа обрешетки)', unit: 'кг', quantity: 2, price: 700, total: 1743 },
      { name: 'Шурупы 4 (Для монтажа металлочерепицы)', unit: 'пач', quantity: 0, price: 1800, total: 0 },
      { name: 'Пена монтажная 70л', unit: 'шт', quantity: 0, price: 3700, total: 0 },
      { name: 'Скобы (Для крепления паро пленки)', unit: 'пач', quantity: 0, price: 400, total: 0 },
      { name: 'Шурупы 4 крупная резьба', unit: 'пач', quantity: 0, price: 700, total: 280 },
      { name: 'OSB 9мм (Для фронтона. Только для двух или односкатных крыш)', unit: 'лист', quantity: 2, price: 5300, total: 10600 }
    ],
    totalMaterialsCost: 96698,
    roofWorkCost: 0,
    deliveryCost: 60000,
    totalCost: 156698
  });

  // Подписка на изменения цен в продуктах
  useEffect(() => {
    const SYNCED_PRODUCTS = [
      'Брус 40x140x6000',
      'Брус 25x100x6000 (Для обрешетки)',
      'Металлочерепица глянец (Сырье Россия) (Форм СуперМонтеррей толщ. 0,45мм)',
      'Паро. пленка (Под обрешетку) и (Для обшивки потолок 2эт.)',
      'Конек бочкообразный (Для металлочерепицы двухметровый)',
      'Заглушка конусная (Для бочкообразного конька)',
      'Тройник (Для стыков бочкообразных коньков)',
      'Ендова внешняя 80x80мм (Для металлочерепицы двухметровая)',
      'Ендова внутренняя 600x600мм (Под металлочереп 600x600 двухметровая)',
      'Планка примыкания к стене 150x150мм (В местах примык. мет. чер. к стене)',
      'Пенополистирол Толщ 150мм (Для Утепления пот. 2-го эт)',
      'Гвозди 70 (Для монтажа обрешетки)',
      'Шурупы 4 (Для монтажа металлочерепицы)',
      'Пена монтажная 70л',
      'Скобы (Для крепления паро пленки)',
      'OSB 9мм (Для фронтона. Только для двух или односкатных крыш)'
    ];

    const conditions = SYNCED_PRODUCTS.map(name => where('name', '==', name));
    const q = query(collection(db, 'products'), or(...conditions));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const product = change.doc.data() as Product;
          
          setEstimateData(prev => {
            const newItems = prev.items.map(item => {
              if (item.name === product.name) {
                const newTotal = item.quantity * product.price;
                return {
                  ...item,
                  price: product.price,
                  total: newTotal
                };
              }
              return item;
            });

            const totalMaterialsCost = newItems.reduce((sum, item) => sum + item.total, 0);
            return {
              ...prev,
              items: newItems,
              totalMaterialsCost,
              totalCost: totalMaterialsCost + prev.roofWorkCost + prev.deliveryCost
            };
          });
        }
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadEstimateData = async () => {
      try {
        const estimateRef = doc(db, 'roofEstimates', clientId);
        const estimateDoc = await getDoc(estimateRef);
        
        if (estimateDoc.exists()) {
          setEstimateData(estimateDoc.data() as RoofEstimateData);
        }
      } catch (error) {
        console.error('Error loading roof estimate data:', error);
      }
    };

    loadEstimateData();
  }, [clientId]);

  useEffect(() => {
    const saveEstimateData = async () => {
      if (!isEditing) return;

      try {
        const estimateRef = doc(db, 'roofEstimates', clientId);
        const dataToSave = prepareEstimateForSave({
          ...estimateData,
          updatedAt: serverTimestamp()
        });
        await setDoc(estimateRef, dataToSave);
      } catch (error) {
        console.error('Error saving roof estimate data:', error);
      }
    };

    const debounceTimer = setTimeout(saveEstimateData, 500);
    return () => clearTimeout(debounceTimer);
  }, [clientId, isEditing, estimateData]);

  const handleUpdateItem = (index: number, field: keyof typeof estimateData.items[0], value: number) => {
    setEstimateData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
        total: field === 'quantity' ? value * newItems[index].price : 
               field === 'price' ? value * newItems[index].quantity :
               value
      };

      const totalMaterialsCost = newItems.reduce((sum, item) => sum + item.total, 0);
      return {
        ...prev,
        items: newItems,
        totalMaterialsCost,
        totalCost: totalMaterialsCost + prev.roofWorkCost + prev.deliveryCost
      };
    });
  };

  const handleUpdateCosts = (field: 'roofWorkCost' | 'deliveryCost', value: number) => {
    setEstimateData(prev => ({
      ...prev,
      [field]: value,
      totalCost: prev.totalMaterialsCost + (field === 'roofWorkCost' ? value : prev.roofWorkCost) + (field === 'deliveryCost' ? value : prev.deliveryCost)
    }));
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center text-gray-700 hover:text-gray-900 mb-4"
      >
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 mr-1" />
        ) : (
          <ChevronDown className="w-5 h-5 mr-1" />
        )}
        Смета Крыши
      </button>

      {isExpanded && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white text-center py-2">
            Крыша+навес
          </div>
          
          <RoofEstimateTable
            items={estimateData.items}
            totalMaterialsCost={estimateData.totalMaterialsCost}
            roofWorkCost={estimateData.roofWorkCost}
            deliveryCost={estimateData.deliveryCost}
            totalCost={estimateData.totalCost}
            onUpdateItem={handleUpdateItem}
            onUpdateCosts={handleUpdateCosts}
            isEditing={isEditing}
          />
        </div>
      )}
    </div>
  );
};