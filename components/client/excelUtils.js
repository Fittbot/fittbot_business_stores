// excelUtils.js - Place this in a utilities folder
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { showToast } from '../../utils/Toaster';

/**
 * Formats client data for export to Excel
 * @param {Array} clients - Array of client objects
 * @returns {Array} - Formatted array for Excel export
 */
export const formatClientsForExport = (clients) => {
  return clients.map((client) => ({
    Name: client.name || 'N/A',
    Email: client.email || 'N/A',
    Phone: client.contact || 'N/A',
    Age: client.age || 'N/A',
    Location: client.place || 'N/A',
    Batch: client.batch || 'N/A',
    'Training Type': client.training || 'N/A',
    'Fee Status': client.feePaid || 'N/A',
    Goal: client.goal || 'N/A',
    'Joined Date': client.joined_date || 'N/A',
    BMI: client.bmi || 'N/A',
  }));
};

/**
 * Creates an Excel file from data
 * @param {Array} data - Formatted data array
 * @param {String} sheetName - Name for the Excel sheet
 * @returns {String} - Base64 encoded Excel content
 */
export const createExcelBuffer = (data, sheetName = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'base64',
  });
};

/**
 * Writes Excel buffer to file system and returns path
 * @param {String} buffer - Base64 encoded Excel content
 * @param {String} fileName - Name for the saved file
 * @returns {Promise<String>} - Path to saved file
 */
export const saveExcelToFileSystem = async (buffer, fileName) => {
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, buffer, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return filePath;
};

/**
 * Shares an Excel file with other apps
 * @param {String} filePath - Path to the Excel file
 * @param {String} dialogTitle - Title for the share dialog
 * @returns {Promise<void>}
 */
export const shareExcelFile = async (
  filePath,
  dialogTitle = 'Share Excel File'
) => {
  await Sharing.shareAsync(filePath, {
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle,
    UTI: 'com.microsoft.excel.xlsx',
  });
};

/**
 * Main function to export client data to Excel and share
 * @param {Array} clients - Array of client objects
 * @param {String} category - Category name for the file
 * @returns {Promise<void>}
 */
export const exportClientsToExcel = async (clients, category = 'all') => {
  try {
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    // Format data for export
    const formattedData = formatClientsForExport(clients);

    // Create Excel buffer
    const excelBuffer = createExcelBuffer(formattedData, 'Clients');

    // Generate file name with current date
    const fileName = `clients_${category}_${
      new Date().toISOString().split('T')[0]
    }.xlsx`;

    // Save to file system
    const filePath = await saveExcelToFileSystem(excelBuffer, fileName);

    // Share the file
    await shareExcelFile(
      filePath,
      `${category.charAt(0).toUpperCase() + category.slice(1)} Clients Data`
    );

    return true;
  } catch (error) {
    showToast({
      type: 'error',
      title: 'Excel export error',
      desc: error.message,
    });
    throw error;
  }
};
