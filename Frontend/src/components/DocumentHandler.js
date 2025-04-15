import React, { useEffect, useRef } from 'react';
import { createDirectDownloadUrl } from '../firebase/config';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../firebase/config';

// This component attempts to load documents using different strategies
// to bypass CORS and security restrictions
const DocumentHandler = ({ storagePath, onLoaded, onError }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!storagePath) {
      onError(new Error('No storage path provided'));
      return;
    }

    const loadDocument = async () => {
      try {
        // First approach: Get a regular Firebase Storage download URL
        console.log(`DocumentHandler: Getting download URL for path: ${storagePath}`);
        const storageRef = ref(storage, storagePath);
        const downloadUrl = await getDownloadURL(storageRef);

        console.log(`DocumentHandler: Got download URL: ${downloadUrl}`);

        // Try direct download first instead of iframe
        try {
          // Create a temporary link element to trigger download
          const tempLink = document.createElement('a');
          tempLink.style.display = 'none';
          tempLink.href = downloadUrl;
          tempLink.setAttribute('download', storagePath.split('/').pop());
          tempLink.setAttribute('target', '_blank');

          document.body.appendChild(tempLink);

          // Note: We're not clicking the link automatically to download
          // Instead, we'll notify the parent that the URL is available

          // We got the download URL successfully, so notify the parent
          onLoaded(downloadUrl);

          // Clean up the temp link
          document.body.removeChild(tempLink);
          return;
        } catch (downloadError) {
          console.error('DocumentHandler: Direct download approach failed:', downloadError);
        }

        // Fallback to iframe approach if direct download didn't work
        const directUrl = createDirectDownloadUrl(storagePath);

        if (!directUrl) {
          throw new Error('Could not create direct URL for document');
        }

        console.log(`DocumentHandler: Falling back to iframe with URL: ${directUrl}`);

        // Create an invisible iframe to load the document
        const iframe = document.createElement('iframe');
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.position = 'absolute';
        iframe.style.opacity = '0';

        // Set up a promise that resolves/rejects based on iframe load events
        const iframePromise = new Promise((resolve, reject) => {
          iframe.onload = () => {
            console.log('DocumentHandler: iframe loaded');
            resolve(directUrl);
          };

          iframe.onerror = (error) => {
            console.error('DocumentHandler: iframe error:', error);
            reject(new Error('Failed to load document in iframe'));
          };
        });

        // Add a timeout to handle cases where the iframe fails silently
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Iframe load timed out - this usually means access was blocked'));
          }, 5000); // 5 second timeout
        });

        // Add iframe to DOM
        iframe.src = directUrl;
        document.body.appendChild(iframe);
        iframeRef.current = iframe;

        // Wait for either the iframe to load or the timeout
        try {
          const result = await Promise.race([iframePromise, timeoutPromise]);
          onLoaded(result);
        } catch (loadError) {
          console.warn('DocumentHandler: Iframe approach failed:', loadError.message);

          // If the iframe approach fails, we still have the download URL
          // So we can fall back to that
          onLoaded(downloadUrl);
        }
      } catch (error) {
        console.error('DocumentHandler: Error handling document:', error);
        onError(error);
      }
    };

    loadDocument();

    // Cleanup function
    return () => {
      if (iframeRef.current) {
        document.body.removeChild(iframeRef.current);
      }
    };
  }, [storagePath, onLoaded, onError]);

  // This component doesn't render anything visible
  return null;
};

export default DocumentHandler; 