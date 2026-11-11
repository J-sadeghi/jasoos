import { Capacitor } from '@capacitor/core';

/** True inside the Android/iOS app built with Capacitor. */
export const isNativeApp = () => Capacitor.isNativePlatform();
