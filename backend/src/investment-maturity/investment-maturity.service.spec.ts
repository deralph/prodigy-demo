import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentMaturityService } from './investment-maturity.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { createMockPrisma, MOCK } from '../../test/helpers/mock-prisma';
import { createMockNotifications } from '../../test/helpers/mock-notifications';

describe('InvestmentMaturityService', () => {
  let service: InvestmentMaturityService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let notifications: ReturnType<typeof createMockNotifications>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    notifications = createMockNotifications();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentMaturityService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();
    service = module.get(InvestmentMaturityService);
  });

  afterEach(() => jest.clearAllMocks());

  const investmentWithClient = {
    ...MOCK.investment,
    client: MOCK.client,
    product: MOCK.product,
  };

  describe('run()', () => {
    it('sends maturity reminders for investments maturing in exactly 3 days', async () => {
      prisma.investment.findMany
        .mockResolvedValueOnce([investmentWithClient] as any) // reminders query
        .mockResolvedValueOnce([]); // matured query

      const result = await service.run();
      expect(result.remindedCount).toBe(1);
      expect(notifications.sendInvestmentMaturingSoonEmail).toHaveBeenCalledWith(
        MOCK.client.email, MOCK.client.name, MOCK.product.name, expect.any(Number), expect.any(Date), 3,
      );
    });

    it('marks matured investments as MATURED and notifies the client', async () => {
      prisma.investment.findMany
        .mockResolvedValueOnce([]) // reminders query
        .mockResolvedValueOnce([investmentWithClient] as any); // matured query
      prisma.investment.update.mockResolvedValueOnce({ ...investmentWithClient, status: 'MATURED' } as any);

      const result = await service.run();
      expect(result.maturedCount).toBe(1);
      expect(prisma.investment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'MATURED' }) }),
      );
      expect(notifications.sendInvestmentMaturedEmail).toHaveBeenCalledWith(
        MOCK.client.email, MOCK.client.name, MOCK.product.name, expect.any(Number),
      );
    });

    it('skips notifying when the client record has no email (defensive)', async () => {
      const noEmailInv = { ...investmentWithClient, client: { ...MOCK.client, email: null } };
      prisma.investment.findMany
        .mockResolvedValueOnce([noEmailInv] as any)
        .mockResolvedValueOnce([]);

      await service.run();
      expect(notifications.sendInvestmentMaturingSoonEmail).not.toHaveBeenCalled();
    });

    it('writes an audit log entry when triggered manually by an admin', async () => {
      prisma.investment.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      await service.run({ adminUserId: 'admin-1', adminRole: 'OPERATIONS' });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'INVESTMENT_MATURITY_CHECK_RUN_MANUALLY' }) }),
      );
    });

    it('does not write an audit log when run by the cron (no admin context)', async () => {
      prisma.investment.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      await service.run();
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('continues processing other investments if one update fails', async () => {
      const second = { ...investmentWithClient, id: 'inv-2' };
      prisma.investment.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([investmentWithClient, second] as any);
      prisma.investment.update
        .mockRejectedValueOnce(new Error('db hiccup'))
        .mockResolvedValueOnce({ ...second, status: 'MATURED' } as any);

      const result = await service.run();
      expect(result.maturedCount).toBe(2); // both were attempted
      expect(notifications.sendInvestmentMaturedEmail).toHaveBeenCalledTimes(1); // only the successful one notified
    });
  });
});
