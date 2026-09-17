-- Lets LotDetailPage/LiveAuctionPage subscribe to live price/close-time/bid-feed updates the
-- same way BiddingPanel already does for the old model.
alter publication supabase_realtime add table public.lots;
alter publication supabase_realtime add table public.auctions;
alter publication supabase_realtime add table public.lot_bids;
