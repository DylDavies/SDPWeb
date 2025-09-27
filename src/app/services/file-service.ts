import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';
import { IDocument } from '../models/interfaces/IDocument.interface';
interface PresignedUrlResponse {
  url: string;
  fileKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private http = inject(HttpClient);
  private httpService = inject(HttpService);

  /**
   * Step 1: Request a pre-signed URL from the backend for uploading.
   * @param filename The name of the file to be uploaded.
   * @param contentType The MIME type of the file.
   */
  getPresignedUploadUrl(filename: string, contentType: string): Observable<PresignedUrlResponse> {
    return this.httpService.post<PresignedUrlResponse>('documents/upload-url', { filename, contentType });
  }

  /**
   * Step 2: Upload the actual file data to the pre-signed URL.
   * This request goes directly to the cloud storage provider (e.g., DigitalOcean Spaces), not your backend.
   * @param url The pre-signed URL received from the backend.
   * @param file The file to upload.
   */
  uploadFileToSignedUrl(url: string, file: File): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': file.type });
    return this.http.put(url, file, { headers });
  }

  /**
   * Step 3: Notify the backend that the upload is complete to create a database record.
   * @param fileKey The unique key for the file in the storage bucket.
   * @param originalFilename The original name of the uploaded file.
   * @param contentType The MIME type of the file.
   */
  finalizeUpload(fileKey: string, originalFilename: string, contentType: string): Observable<IDocument> {
    return this.httpService.post<IDocument>('documents/upload-complete', { fileKey, originalFilename, contentType });
  }
  
  /**
   * Fetches a list of all document records from the database.
   */
  getDocuments(): Observable<IDocument[]> {
      return this.httpService.get<IDocument[]>('documents');
  }

  /**
   * Requests a temporary, secure URL to download a specific document.
   * @param documentId The ID of the document record in the database.
   */
  getPresignedDownloadUrl(documentId: string): Observable<{ url: string }> {
    return this.httpService.get<{ url: string }>(`documents/${documentId}/download-url`);
  }
}