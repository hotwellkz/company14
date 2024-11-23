import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, or, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FloorEstimateTable } from './FloorEstimateTable';
import { FloorEstimateData } from '../../types/estimate';
import { Product } from '../../types/product';
import { prepareEstimateForSave } from '../../utils/estimateUtils';

interface FloorEstimateProps {
  isEditing: boolean;
  clientId: string;
}

export const FloorEstimate: React.FC<FloorEstimateProps> = ({
  isEditing,
  clientId
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [estimateData, setEstimateData] = useState<FloorEstimateData>({
    items: [
      { name: 'Брус 40x190x6000 (Для перекрыт расстояние между балками 29см)', unit: 'шт', quantity: 2, price: 5800, total: 11600 },
      { name: 'OSB 18 (Для перекрытия (пол второго этажа))', unit: 'лист', quantity: 1, price: 15500, total: 15500 },
      { name: 'Шурупы 4 крупная резьба', unit: 'пач', quantity: 0, price: 700, total: 140 },
      { name: 'Гвозди 120', unit: 'кг', quantity: 0, price: 700, total: 70 }
    ],
    totalMaterialsCost: 27310,
    installationCost: 0,
    deliveryCost: 30000,
    totalCost: 57310
  });

  // Подписка на изменения цен в продуктах
  useEffect(() => {
    const SYNCED_PRODUCTS = [
      'Брус 40x190x6000 (Для перекрыт расстояние между балками 29см)',
      'OSB 18 (Для перекрытия (пол второго этажа))',
      'Шурупы 4 крупная резьба',
      'Гвозди 120'
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
              totalCost: totalMaterialsCost + prev.installationCost + prev.deliveryCost
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
        const estimateRef = doc(db, 'floorEstimates', clientId);
        const estimateDoc = await getDoc(estimateRef);
        
        if (estimateDoc.exists()) {
          setEstimateData(estimateDoc.data() as FloorEstimateData);
        }
      } catch (error) {
        console.error('Error loading floor estimate data:', error);
      }
    };

    loadEstimateData();
  }, [clientId]);

  useEffect(() => {
    const saveEstimateData = async () => {
      if (!isEditing) return;

      try {
        const estimateRef = doc(db, 'floorEstimates', clientId);
        const dataToSave = prepareEstimateForSave({
          ...estimateData,
          updatedAt: serverTimestamp()
        });
        await setDoc(estimateRef, dataToSave);
      } catch (error) {
        console.error('Error saving floor estimate data:', error);
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
        totalCost: totalMaterialsCost + prev.installationCost + prev.deliveryCost
      };
    });
  };

  const handleUpdateCosts = (field: 'installationCost' | 'deliveryCost', value: number) => {
    setEstimateData(prev => ({
      ...prev,
      [field]: value,
      totalCost: prev.totalMaterialsCost + (field === 'installationCost' ? value : prev.installationCost) + (field === 'deliveryCost' ? value : prev.deliveryCost)
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
        Смета Межэтажного Перекрытия
      </button>

      {isExpanded && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white text-center py-2">
            ПЕРЕКРЫТИЕ из балок + OSB 18мм между первым и вторым этажами
          </div>
          
          <FloorEstimateTable
            items={estimateData.items}
            totalMaterialsCost={estimateData.totalMaterialsCost}
            installationCost={estimateData.installationCost}
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