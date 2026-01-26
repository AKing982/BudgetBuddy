import React, { useState, useRef } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CancelIcon from '@mui/icons-material/Cancel';

interface Props {
    onUpload: (file: File) => void;
    onCancel: () => void;
    loading: boolean;
}

export const ReceiptUpload: React.FC<Props> = ({ onUpload, onCancel, loading }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = () => {
        if (selectedFile) {
            onUpload(selectedFile);
        }
    };

    const handleClearSelection = () => {
        setSelectedFile(null);
        setPreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Upload Receipt
                </Typography>

                <Card variant="outlined" sx={{ p: 4, textAlign: 'center', mb: 3 }}>
                    {!preview ? (
                        <Box>
                            <PhotoCameraIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Upload Receipt Image
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                Take a photo of your receipt or upload an existing image
                            </Typography>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<CloudUploadIcon />}
                                onClick={() => fileInputRef.current?.click()}
                                size="large"
                            >
                                Choose File
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            <Box
                                component="img"
                                src={preview}
                                alt="Receipt preview"
                                sx={{
                                    maxHeight: 400,
                                    maxWidth: '100%',
                                    borderRadius: 2,
                                    mb: 2
                                }}
                            />
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {selectedFile?.name}
                            </Typography>
                            <Button
                                color="primary"
                                onClick={handleClearSelection}
                            >
                                Choose Different Image
                            </Button>
                        </Box>
                    )}
                </Card>

                {preview && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <strong>Note:</strong> Our AI will automatically extract items, prices, and store information from your receipt.
                    </Alert>
                )}

                <Box display="flex" justifyContent="flex-end" gap={2}>
                    <Button
                        startIcon={<CancelIcon />}
                        onClick={onCancel}
                        size="large"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        onClick={handleUpload}
                        disabled={!selectedFile || loading}
                        size="large"
                    >
                        {loading ? 'Processing...' : 'Upload & Process Receipt'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};