/**
 * A permissive mock NotificationsService for unit tests.
 * Every method resolves successfully and does nothing — tests that care
 * about a specific notification call assert on `notifications.someMethod`
 * directly; everything else is just a safe no-op so service specs don't
 * need to enumerate every template method.
 */
const RESERVED_PROPS = new Set([
  'then', 'catch', 'finally', 'constructor', 'toJSON', 'toString', 'valueOf',
  'asymmetricMatch', 'nodeType', '$$typeof',
]);

export function createMockNotifications() {
  const target: Record<string, any> = {};
  const handler: ProxyHandler<Record<string, any>> = {
    get(obj, prop) {
      if (typeof prop === 'symbol' || RESERVED_PROPS.has(prop as string)) {
        return obj[prop as string];
      }
      if (prop in obj) return obj[prop as string];
      const fn = jest.fn().mockResolvedValue({ success: true });
      obj[prop as string] = fn;
      return fn;
    },
  };
  return new Proxy(target, handler) as Record<string, jest.Mock> & {
    sendEmail: jest.Mock;
    notifyAdminsByRole: jest.Mock;
  };
}
