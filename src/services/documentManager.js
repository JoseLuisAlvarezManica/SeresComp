import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export const getAllDocuments = async () => {
  try {
    console.log('Fetching all documents from Firestore...');
    const DocumentCollection = collection(db, 'Facturas');
    const snapshot = await getDocs(DocumentCollection);
    
    if (snapshot.empty) {
      console.log('No documents found.');
      return [];
    }
    
    const documents = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    
    console.log('Fetched documents:', documents);
    return documents;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

export const getDocumentByFolio = async (folio) => {
  try {
    console.log(`Fetching prints for folio: ${folio}`);
    const printsCollection = collection(db, 'Facturas');
    const q = query(printsCollection, where('Folio fiscal', '==', folio));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`No prints found for folio: ${folio}`);
      return [];
    }

    const userFolio = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    console.log(`Fetched ${userFolio.length} documents for folio ${folio}`);
    return userFolio;
  } catch (error) {
    console.error('Error fetching prints by folio:', error);
    return [];
  }
};

export const createDocument = async (documentData) => {
  try {
    console.log('Creating a new document:', documentData);
    const processedData = { ...documentData };
    
    if (processedData.TabladeCompra && Array.isArray(processedData.TabladeCompra)) {
      processedData.TabladeCompra_json = JSON.stringify(processedData.TabladeCompra);
      delete processedData.TabladeCompra;
    }
    
    const dataWithTimestamp = {
      ...processedData,
      created_at: serverTimestamp()
    };
    
    const DocumentCollection = collection(db, 'Facturas');
    const docRef = await addDoc(DocumentCollection, dataWithTimestamp);
    console.log('New document created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating new document:', error);
    throw error;
  }
};

export const updateDocument = async (folio, updatedData) => {
  try {
    console.log(`Updating document ${folio} with:`, updatedData);
    const folioRef = doc(db, 'Facturas', folio);

    const printDoc = await getDoc(folioRef);
    if (!printDoc.exists()) {
      console.error(`Document ${folio} does not exist.`);
      return;
    }

    const processedData = { ...updatedData };
    if (processedData.TabladeCompra && Array.isArray(processedData.TabladeCompra)) {
      processedData.TabladeCompra_json = JSON.stringify(processedData.TabladeCompra);
      delete processedData.TabladeCompra;
    }

    const dataWithTimestamp = {
      ...processedData,
      updated_at: serverTimestamp()
    };

    await updateDoc(folioRef, dataWithTimestamp);
    console.log(`Document ${folio} updated successfully.`);
  } catch (error) {
    console.error(`Error updating document ${folio}:`, error);
  }
};

export const deleteDocument = async (folio) => {
  try {
    console.log(`Deleting document with ID: ${folio}`);
    const documentRef = doc(db, 'Facturas', folio);
    await deleteDoc(documentRef);
    console.log('Document deleted:', folio);
  } catch (error) {
    console.error('Error deleting document:', error);
  }
};