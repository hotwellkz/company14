import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, or, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ConsumablesEstimateTable } from './ConsumablesEstimateTable';
import { ConsumablesEstimateData } from '../../types/estimate';
import { Product } from '../../types/product';
import { prepareEstimateForSave } from '../../utils/estimateUtils';

interface ConsumablesEstimateProps {
  isEditing: boolean;
  clientId: string;
}

export const ConsumablesEstimate: React.FC<ConsumablesEstimateProps> = ({
  isEditing,
  clientId
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [estimateData, setEstimateData] = useState<ConsumablesEstimateData>({
    items: [
      { name: 'Нить строительная', unit: 'шт', quantity: 1, price: 300, total: 300 },
      { name: 'Леска строительная', unit: 'шт', quantity: 1, price: 300, total: 300 },
      { name: 'Анкера 12x150 (Для крепления обвязки к фундаменту)', unit: 'шт', quantity: 89.5, price: 220, total: 19690 },
      { name: 'Шурупы 3 крупная резьба (Для монтажа гипсокар к сип) 1 п на 5 лис', unit: 'пач', quantity: 0, price: 700, total: 0 },
      { name: 'Металлические Скобы (Для монтажа стропил)', unit: 'шт', quantity: 100, price: 80, total: 8000 },
      { name: 'Насадка 8 на шуруповерт (Для шурупов по металлочерепицы)', unit: 'шт', quantity: 1, price: 300, total: 300 },
      { name: 'Мешки мусорные', unit: 'шт', quantity: 10, price: 70, total: 700 },
      { name: 'Насадки крестовые на шуруповерт пр-ва ЗУБР', unit: 'шт', quantity: 5, price: 400, total: 2000 },
      { name: 'Диски 150мм Rodex на болгарку', unit: 'шт', quantity: 5, price: 400, total: 2000 },
      { name: 'Пистолет для пены', unit: 'шт', quantity: 1, price: 3000, total: 3000 },
      { name: 'Карандаши', unit: 'шт', quantity: 5, price: 100, total: 500 },
      { name: 'Лезвия для строительного ножа', unit: 'шт', quantity: 2, price: 300, total: 600 },
      { name: 'Перчатки', unit: 'шт', quantity: 12, price: 300, total: 3600 },
      { name: 'Пленка от дождя самая плотная', unit: 'метр', quantity: 7, price: 400, total: 2800 },
      { name: 'Диск на пчелку 180 по дереву', unit: 'шт', quantity: 1, price: 2000, total: 2000 },
      { name: 'Силикон (Для вентиляции)', unit: 'шт', quantity: 1, price: 2500, total: 2500 },
      { name: 'Скотч (Для монтажа биопленки)', unit: 'шт', quantity: 1, price: 500, total: 500 },
      { name: 'Разное + Износ инструмента + ЗП сотрудникам', unit: '', quantity: 0, price: 0, total: 470000 }
    ],
    totalMaterialsCost: 518790,
    createdAt: undefined,
    updatedAt: undefined
  });

  // Подписка на изменения цен в продуктах
  useEffect(() => {
    const SYNCED_PRODUCTS = [
      'Нить строительная',
      'Леска строительная',
      'Анкера 12x150 (Для крепления обвязки к фундаменту)',
      'Шурупы 3 крупная резьба (Для монтажа гипсокар к сип) 1 п на 5 лис',
      'Металлические Скобы (Для монтажа стропил)',
      'Насадка 8 на шуруповерт (Для шурупов по металлочерепицы)',
      'Мешки мусорные',
      'Насадки крестовые на шуруповерт пр-ва ЗУБР',
      'Диски 150мм Rodex на болгарку',
      'Пистолет для пены',
      'Карандаши',
      'Лезвия для строительного ножа',
      'Перчатки',
      'Пленка от дождя самая плотная',
      'Диск на пчелку 180 по дереву',
      'Силикон (Для вентиляции)',
      'Скотч (Для монтажа биопленки)'
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
              totalMaterialsCost
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
        const estimateRef = doc(db, 'consumablesEstimates', clientId);
        const estimateDoc = await getDoc(estimateRef);
        
        if (estimateDoc.exists()) {
          setEstimateData(estimateDoc.data() as ConsumablesEstimateData);
        }
      } catch (error) {
        console.error('Error loading consumables estimate data:', error);
      }
    };

    loadEstimateData();
  }, [clientId]);

  useEffect(() => {
    const saveEstimateData = async () => {
      if (!isEditing) return;

      try {
        const estimateRef = doc(db, 'consumablesEstimates', clientId);
        const dataToSave = prepareEstimateForSave({
          ...estimateData,
          updatedAt: serverTimestamp()
        });
        await setDoc(estimateRef, dataToSave);
      } catch (error) {
        console.error('Error saving consumables estimate data:', error);
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
        totalMaterialsCost
      };
    });
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
        Смета Расходных материалов
      </button>

      {isExpanded && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white text-center py-2">
            Расходные материалы
          </div>
          
          <ConsumablesEstimateTable
            items={estimateData.items}
            totalMaterialsCost={estimateData.totalMaterialsCost}
            onUpdateItem={handleUpdateItem}
            isEditing={isEditing}
          />
        </div>
      )}
    </div>
  );
};