import React, { useState } from 'react';
import type { ReferenceMaterial } from '../../types';

interface ReferenceViewerProps {
  materials: ReferenceMaterial[];
  onDelete: (materialId: string) => void;
}

export function ReferenceViewer({ materials, onDelete }: ReferenceViewerProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<ReferenceMaterial | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string): JSX.Element => {
    if (type === 'pdf') {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  };

  const handleView = (material: ReferenceMaterial) => {
    setSelectedMaterial(material);
  };

  const handleClose = () => {
    setSelectedMaterial(null);
  };

  const handleDownload = (material: ReferenceMaterial) => {
    const link = document.createElement('a');
    link.href = material.file_url;
    link.download = material.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">参考资料</h3>

      {materials.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          暂无参考资料
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {materials.map((material) => (
            <div
              key={material.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start space-x-3">
                {getFileIcon(material.file_type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{material.file_name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(material.file_size)}</p>
                </div>
              </div>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => handleView(material)}
                  className="flex-1 py-1 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded"
                >
                  查看
                </button>
                <button
                  onClick={() => handleDownload(material)}
                  className="flex-1 py-1 text-sm text-gray-600 hover:text-gray-700 border border-gray-200 rounded"
                >
                  下载
                </button>
                <button
                  onClick={() => {
                    if (confirm('确定要删除这个文件吗？')) {
                      onDelete(material.id);
                    }
                  }}
                  className="py-1 px-2 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium">{selectedMaterial.file_name}</h3>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {selectedMaterial.file_type === 'pdf' ? (
                <iframe
                  src={selectedMaterial.file_url}
                  className="w-full h-full min-h-[600px]"
                  title={selectedMaterial.file_name}
                />
              ) : (
                <img
                  src={selectedMaterial.file_url}
                  alt={selectedMaterial.file_name}
                  className="max-w-full h-auto mx-auto"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}