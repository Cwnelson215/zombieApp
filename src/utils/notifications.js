export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function sendBrowserNotification(title, body) {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: '/images/pic1.jpeg',
      tag: 'infection-notification',
    });
  }
}

// Check if the browser supports Web Push API (not iOS)
export function isPushSupported() {
  // iOS doesn't support Web Push API - check for iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  return 'serviceWorker' in navigator &&
    'PushManager' in window &&
    !isIOS;
}

// Subscribe to push notifications
export async function subscribeToPush(joinCode, authToken) {
  if (!isPushSupported()) {
    console.log('Push notifications not supported on this device');
    return false;
  }

  try {
    // Request notification permission first
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      console.log('Notification permission not granted');
      return false;
    }

    // Get VAPID public key from server
    const response = await fetch('/api/push/vapidPublicKey');
    const { publicKey } = await response.json();

    if (!publicKey) {
      console.log('VAPID public key not configured on server');
      return false;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Subscribe to push
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        joinCode,
        authToken,
        subscription: subscription.toJSON()
      })
    });

    console.log('Push subscription successful');
    return true;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return false;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(joinCode, authToken) {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
    }

    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinCode, authToken })
    });

    return true;
  } catch (error) {
    console.error('Push unsubscribe failed:', error);
    return false;
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
