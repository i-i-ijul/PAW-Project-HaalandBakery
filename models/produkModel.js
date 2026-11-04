// Data masih hardcode. Nanti bagian ini diganti query database,
// sementara controller dan route tidak perlu diubah.
const daftarProduk = [
  {
    id: 1,
    nama: 'Sourdough',
    kategori: 'Tangy flavor, Chewy Texture',
    deskripsi: 'Roti yang dibuat dari fermentasi air.',
    harga: 20,
    stok: 50
  },
  {
    id: 2,
    nama: 'Nastar',
    kategori: 'Lembut dan manis',
    deskripsi: 'Roti yang cocok buat dijadikan cemilan pendamping kopi/teh yang pahit.',
    harga: 12,
    stok: 50
  },
  {
    id: 3,
    nama: 'Putri Salju',
    kategori: 'Lembut',
    deskripsi: 'Roti yang dilumuri gula putih. Rasanya ada sensasi dingin, manis, dan lembut di mulut.',
    harga: 15,
    stok: 50
  },
];

const ProdukModel = {
  getAll() {
    return daftarProduk;
  },
};

module.exports = ProdukModel;