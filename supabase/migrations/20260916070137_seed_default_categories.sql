insert into public.categories (name, slug) values
  ('Furniture', 'furniture'),
  ('Appliances', 'appliances'),
  ('Electronics', 'electronics'),
  ('Kitchenware', 'kitchenware'),
  ('Home Decor', 'home-decor'),
  ('Garden & Outdoor', 'garden-outdoor'),
  ('Tools', 'tools'),
  ('Kids & Baby', 'kids-baby'),
  ('Sporting Goods', 'sporting-goods'),
  ('Collectibles & Antiques', 'collectibles-antiques'),
  ('Other', 'other')
on conflict (slug) do nothing;
