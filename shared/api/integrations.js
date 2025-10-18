import { invokeLLM } from './integrations/aiService.js';
import { sendEmail } from './integrations/emailService.js';
import { uploadFile } from './integrations/fileUpload.js';
import { generateImage } from './integrations/imageGeneration.js';

// Mock Core object to maintain compatibility
export const Core = {
  InvokeLLM: invokeLLM,
  SendEmail: sendEmail,
  UploadFile: uploadFile,
  GenerateImage: generateImage,
  ExtractDataFromUploadedFile: async (params) => {
    console.log('ExtractDataFromUploadedFile called with params:', params);
    // Mock implementation
    return {
      success: true,
      extractedData: {
        text: 'Mock extracted text from file',
        metadata: params
      }
    };
  },
  CreateFileSignedUrl: async (params) => {
    console.log('CreateFileSignedUrl called with params:', params);
    // Mock implementation
    return {
      success: true,
      signedUrl: `https://mock-signed-url.com/${params.fileName || 'file'}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    };
  },
  UploadPrivateFile: async (params) => {
    console.log('UploadPrivateFile called with params:', params);
    // Mock implementation
    return {
      success: true,
      fileId: `mock-file-id-${Date.now()}`,
      url: `https://mock-private-url.com/${params.fileName || 'file'}`
    };
  }
};

// Direct exports for backward compatibility
export const InvokeLLM = invokeLLM;
export const SendEmail = sendEmail;
export const UploadFile = uploadFile;
export const GenerateImage = generateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
export const CreateFileSignedUrl = Core.CreateFileSignedUrl;
export const UploadPrivateFile = Core.UploadPrivateFile;






