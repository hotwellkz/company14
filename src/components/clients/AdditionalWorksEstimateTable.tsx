import React from 'react';
import { AdditionalWorksEstimateItem } from '../../types/estimate';

interface AdditionalWorksEstimateTableProps {
  items: AdditionalWorksEstimateItem[];
  totalCost: number;
  grandTotal: number;
  onUpdateItem: (index: number, field: keyof AdditionalWorksEstimateItem, value: number) => void;
  isEditing: boolean;
}

export const AdditionalWorksEstimateTable: React.FC<AdditionalWorksEstimateTableProps> = ({
  items,
  totalCost,
  grandTotal,
  onUpdateItem,
  isEditing
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2 w-3/4">{item.name}</td>
              <td className="px-4 py-2 text-right">
                <input
                  type="number"
                  value={item.total}
                  onChange={(e) => onUpdateItem(index, 'total', Number(e.target.value))}
                  className="w-32 px-2 py-1 text-right border rounded"
                  disabled={!isEditing}
                />
                ₸
              </td>
            </tr>
          ))}
          <tr className="bg-gray-200 font-bold">
            <td className="px-4 py-2 text-right">Итого, стоимость дополнительных работ</td>
            <td className="px-4 py-2 text-right">{totalCost.toLocaleString()} ₸</td>
          </tr>
          <tr className="bg-blue-100 font-bold">
            <td className="px-4 py-2 text-right text-blue-800">ИТОГО ОБЩАЯ:</td>
            <td className="px-4 py-2 text-right text-blue-800">{grandTotal.toLocaleString()} ₸</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};