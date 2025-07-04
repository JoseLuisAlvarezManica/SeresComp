import { useState } from 'react';
import Scanner from './components/Scanner';
import DocumentViewer from './components/DocumentViewer';

export default function App() {
    return (
    <div>
      <Scanner />
      <DocumentViewer />
    </div>
    );
}