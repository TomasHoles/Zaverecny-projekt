import React, { useState, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import Icon from './Icon';
import '../styles/ImportModal.css';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        toast.error('Pouze CSV soubory jsou podporovány');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        toast.error('Pouze CSV soubory jsou podporovány');
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Nejdříve vyberte soubor');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/transactions/transactions/import_csv/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { imported, skipped, errors } = response.data;

      if (imported > 0) {
        toast.success(`Úspěšně importováno ${imported} transakcí`);
        if (skipped > 0) {
          toast.warning(`Přeskočeno ${skipped} řádků`);
        }
        onImportSuccess();
        onClose();
      } else if (skipped > 0) {
        toast.error(`Všechny transakce byly přeskočeny (${skipped})`);
        if (errors && errors.length > 0) {
          console.error('Import errors:', errors);
        }
      }
    } catch (error: any) {
      console.error('Import error:', error);
      const errorMsg = error.response?.data?.error || 'Chyba při importu dat';
      toast.error(errorMsg);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'Datum,Popis,Kategorie,Typ,Částka\n' +
      '2024-01-15,Nákup v obchodě,Jídlo a nápoje,Výdaj,500\n' +
      '2024-01-16,Výplata,Mzda,Příjem,25000\n' +
      '2024-01-17,Oběd v restauraci,Jídlo a nápoje,Výdaj,350';
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_transakce.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Šablona stažena');
  };

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h2 className="export-modal-title">
            <Icon name="upload" size={24} />
            Import transakcí z CSV
          </h2>
          <button className="export-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="export-modal-content">
          <div className="import-instructions">
            <h3>Formát CSV souboru</h3>
            <p>Váš CSV soubor musí obsahovat následující sloupce:</p>
            <ul>
              <li><strong>Datum</strong> - formát YYYY-MM-DD nebo DD.MM.YYYY (např. 2024-01-15)</li>
              <li><strong>Popis</strong> - popis transakce (volitelné)</li>
              <li><strong>Kategorie</strong> - název kategorie (vytvoří se pokud neexistuje)</li>
              <li><strong>Typ</strong> - "Příjem" nebo "Výdaj"</li>
              <li><strong>Částka</strong> - číselná hodnota (např. 500 nebo 500.50)</li>
            </ul>
            <button className="download-template-btn" onClick={downloadTemplate}>
              <Icon name="download" size={18} />
              Stáhnout vzorovou šablonu
            </button>
          </div>

          <div 
            className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {file ? (
              <div className="file-selected">
                <Icon name="file" size={48} />
                <p className="file-name">{file.name}</p>
                <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
                <button 
                  className="change-file-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  Změnit soubor
                </button>
              </div>
            ) : (
              <div className="file-upload-prompt">
                <Icon name="upload" size={48} />
                <p>Přetáhněte CSV soubor sem</p>
                <p className="file-upload-or">nebo</p>
                <button className="select-file-btn">
                  Vybrat soubor
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="export-modal-footer">
          <button className="button-secondary" onClick={onClose} disabled={importing}>
            Zrušit
          </button>
          <button 
            className="button-primary" 
            onClick={handleImport}
            disabled={!file || importing}
          >
            {importing ? (
              <>
                <span className="spinner-small"></span>
                Importuji...
              </>
            ) : (
              <>
                <Icon name="upload" size={18} />
                Importovat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
