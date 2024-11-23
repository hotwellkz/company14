import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdditionalWorksEstimateTable } from './AdditionalWorksEstimateTable';
import { AdditionalWorksEstimateData } from '../../types/estimate';

interface AdditionalWorksEstimateProps {
  isEditing: boolean;
  clientId: string;
}

export const AdditionalWorksEstimate: React.FC<AdditionalWorksEstimateProps> = ({
  isEditing,
  clientId
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [estimateData, setEstimateData] = useState<AdditionalWorksEstimateData>({
    items: [
      { name: 'Общая стоимость всех работ (Зарплата строителям)', unit: '', quantity: 0, price: 0, total: 0 },
      { name: 'ЗП Проектирование дома и кан, водопр, тп, и смета', unit: '', quantity: 0, price: 0, total: 30000 },
      { name: 'ЗП по рассрочки домкомплекта', unit: '', quantity: 0, price: 0, total: 2000 }
    ],
    totalCost: 32000,
    grandTotal: 5629577
  });

  useEffect(() => {
    const loadEstimateData = async () => {
      try {
        const estimateRef = doc(db, 'additionalWorksEstimates', clientId);
        const estimateDoc = await getDoc(estimateRef);
        
        if (estimateDoc.exists()) {
          setEstimateData(estimateDoc.data() as AdditionalWorksEstimateData);
        }
      } catch (error) {
        console.error('Error loading additional works estimate data:', error);
      }
    };

    loadEstimateData();
  }, [clientId]);

  useEffect(() => {
    const saveEstimateData = async () => {
      if (!isEditing) return;

      try {
        const estimateRef = doc(db, 'additionalWorksEstimates', clientId);
        await setDoc(estimateRef, {
          ...estimateData,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error saving additional works estimate data:', error);
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

      const totalCost = newItems.reduce((sum, item) => sum + item.total, 0);
      return {
        ...prev,
        items: newItems,
        totalCost,
        grandTotal: totalCost // В реальном приложении здесь нужно добавить суммы из других смет
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
        Смета Дополнительных Работ
      </button>

      {isExpanded && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white text-center py-2">
            ДОПОЛНИТЕЛЬНЫЕ РАБОТЫ
          </div>
          
          <AdditionalWorksEstimateTable
            items={estimateData.items}
            totalCost={estimateData.totalCost}
            grandTotal={estimateData.grandTotal}
            onUpdateItem={handleUpdateItem}
            isEditing={isEditing}
          />
        </div>
      )}
    </div>
  );
};