import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import ProductCard from '../../components/ui/ProductCard';

export default function Products() {
  const { plans, user, walletBalance } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const clientType = user?.clientType?.toLowerCase() || user?.role?.toLowerCase();

  // Filter to only products the current client type is eligible for
  const visiblePlans = useMemo(() => {
    if (!plans) return [];
    return plans.filter(p => {
      if (p.status !== 'ACTIVE') return false;
      if (!p.clientTypes?.length) return true;
      return p.clientTypes.some(ct => ct.toLowerCase() === clientType);
    });
  }, [plans, clientType]);

  // Derive the base path from the current location so navigation works for all roles
  const basePath = location.pathname.replace(/\/products.*$/, '/products');

  const handleCardClick = (plan) => navigate(`${basePath}/${plan.id}`);

  return (
    <div>
      <PageHeader
        title="Investment Products"
        subtitle="Explore investment opportunities available to you"
      />

      {visiblePlans.length === 0 && (
        <EmptyState
          icon={TrendingUp}
          title="No investment products available"
          message="Investment products matching your account type will appear here once they are configured by the Prodigy Finance team."
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18, alignItems: 'stretch' }} className="animate-in delay-1">
        {visiblePlans.map((plan, idx) => (
          <div key={plan.id} style={{ display: 'flex' }} className={`animate-in delay-${Math.min(idx + 1, 4)}`}>
            <ProductCard
              plan={plan}
              variant="client"
              walletBalance={walletBalance}
              onClick={handleCardClick}
              onInvest={handleCardClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
