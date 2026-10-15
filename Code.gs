const SHEET_ID = ''; // OPCIONAL: ID de una planilla existente. Si queda vacío, la app crea una.
const RECEIPTS_ROOT_FOLDER_ID = ''; // OPCIONAL: ID de una carpeta de Drive existente. Si queda vacío, se crea "Donner Turismo - Comprobantes".

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'ping';
    if (action === 'load') {
      return json_({ok:true, data:loadBackup_()});
    }
    return json_({ok:true, message:'Donner API activa'});
  } catch (err) {
    return json_({ok:false, error:String(err)});
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (body.action === 'backup') {
      saveBackup_(body.payload || {});
      return json_({ok:true});
    }

    if (body.action === 'uploadReceipt') {
      const result = uploadReceipt_(body);
      return json_(Object.assign({ok:true}, result));
    }

    if (body.action === 'deleteReceipt') {
      if (!body.fileId) throw new Error('Falta fileId.');
      DriveApp.getFileById(body.fileId).setTrashed(true);
      return json_({ok:true});
    }

    return json_({ok:false, error:'Acción no válida'});
  } catch (err) {
    return json_({ok:false, error:String(err)});
  }
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = SHEET_ID || props.getProperty('DONNER_SHEET_ID');
  if (!id) {
    const ss = SpreadsheetApp.create('Donner Turismo - Base de datos');
    id = ss.getId();
    props.setProperty('DONNER_SHEET_ID', id);
  }
  return SpreadsheetApp.openById(id);
}

function getReceiptsRootFolder_() {
  const props = PropertiesService.getScriptProperties();
  let id = RECEIPTS_ROOT_FOLDER_ID || props.getProperty('DONNER_RECEIPTS_FOLDER_ID');
  if (id) return DriveApp.getFolderById(id);

  const folders = DriveApp.getFoldersByName('Donner Turismo - Comprobantes');
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Donner Turismo - Comprobantes');
  props.setProperty('DONNER_RECEIPTS_FOLDER_ID', folder.getId());
  return folder;
}

function getTripReceiptFolder_(tripId, tripName) {
  const root = getReceiptsRootFolder_();
  const safeName = sanitizeName_((tripName || 'Viaje') + ' - ' + (tripId || 'sin-id'));
  const folders = root.getFoldersByName(safeName);
  return folders.hasNext() ? folders.next() : root.createFolder(safeName);
}

function uploadReceipt_(body) {
  if (!body.fileBase64) throw new Error('No se recibió el archivo.');
  const m = body.metadata || {};
  const bytes = Utilities.base64Decode(body.fileBase64);
  const mimeType = body.mimeType || 'application/octet-stream';
  const originalName = sanitizeFileName_(body.fileName || 'comprobante');
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Argentina/Tucuman', 'yyyyMMdd-HHmmss');
  const fileName = timestamp + ' - ' + originalName;

  const folder = getTripReceiptFolder_(m.tripId, m.tripName);
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const file = folder.createFile(blob);
  file.setDescription(
    'Donner Turismo\n' +
    'Viaje: ' + (m.tripName || '') + '\n' +
    'Detalle: ' + (m.description || '') + '\n' +
    'Destinatario: ' + (m.recipient || '') + '\n' +
    'Monto: ' + (m.currency || '') + ' ' + (m.amount || '')
  );

  return {
    fileId:file.getId(),
    fileUrl:file.getUrl(),
    fileName:file.getName(),
    folderId:folder.getId(),
    folderUrl:folder.getUrl()
  };
}

function sanitizeName_(s) {
  return String(s || '').replace(/[\\/:*?"<>|#%{}]/g, '-').substring(0, 120);
}

function sanitizeFileName_(s) {
  return String(s || 'comprobante').replace(/[\\/:*?"<>|#%{}]/g, '-').substring(0, 150);
}

function saveBackup_(db) {
  const ss = getSpreadsheet_();
  writeSheet_(ss, 'Viajes',
    ['id','name','destination','start','end','passengers','responsible','notes','created'],
    db.trips || []);

  writeSheet_(ss, 'Costos',
    ['id','tripId','category','concept','providerId','currency','pricingMode','passengerCount','unitAmount','qty','unit','total','notes','created'],
    db.costs || []);

  writeSheet_(ss, 'Pagos',
    ['id','tripId','costId','date','providerId','concept','method','currency','amount','receipt','notes','created'],
    db.payments || []);

  writeSheet_(ss, 'Proveedores',
    ['id','name','type','phone','tax','notes'],
    db.providers || []);

  writeSheet_(ss, 'DolaresRechazados',
    ['id','date','passenger','tripId','amount','reason','status','notes','created'],
    db.rejectedDollars || []);

  writeSheet_(ss, 'Comprobantes',
    ['id','tripId','date','costId','description','recipient','currency','amount','notes','fileId','fileUrl','fileName','folderUrl','uploadedAt'],
    db.receipts || []);
}

function loadBackup_() {
  const ss = getSpreadsheet_();
  return {
    trips: readSheet_(ss,'Viajes'),
    costs: readSheet_(ss,'Costos'),
    payments: readSheet_(ss,'Pagos'),
    providers: readSheet_(ss,'Proveedores'),
    rejectedDollars: readSheet_(ss,'DolaresRechazados'),
    receipts: readSheet_(ss,'Comprobantes')
  };
}

function writeSheet_(ss, name, headers, rows) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.clearContents();
  sh.getRange(1,1,1,headers.length).setValues([headers]);
  if (rows.length) {
    const data = rows.map(r => headers.map(h => r[h] === undefined ? '' : r[h]));
    sh.getRange(2,1,data.length,headers.length).setValues(data);
  }
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, headers.length);
}

function readSheet_(ss,name) {
  const sh = ss.getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getValues();
  const headers = values.shift();
  return values.map(row => {
    const o = {};
    headers.forEach((h,i)=>o[h]=row[i]);
    return o;
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
