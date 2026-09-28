export interface RwStat {
  rw: string;
  rtCount: number;
  kkCount: number;
  population: number;
  microBusinessEstimate: number;
  description: string;
}

export const PENGGILINGAN_DEMOGRAPHICS = {
  kelurahan: "Penggilingan",
  kecamatan: "Cakung",
  kotaAdministrasi: "Jakarta Timur",
  provinsi: "DKI Jakarta",
  kodePos: "13940",
  luasWilayahKm2: 4.39,
  totalPenduduk: 92450,
  totalKk: 27800,
  totalRw: 19, // total RW di kelurahan
  fokusRw: ["RW 01", "RW 02", "RW 03", "RW 04", "RW 05", "RW 06", "RW 07"],
  rwData: [
    {
      rw: "RW 01",
      rtCount: 12,
      kkCount: 1450,
      population: 4890,
      microBusinessEstimate: 42,
      description: "Wilayah sentra kuliner dan jasa mandiri padat penduduk dekat akses stasiun dan jalan utama."
    },
    {
      rw: "RW 02",
      rtCount: 14,
      kkCount: 1680,
      population: 5320,
      microBusinessEstimate: 38,
      description: "Wilayah permukiman warga dengan sebaran toko kelontong dan jasa perbaikan teknik elektro."
    },
    {
      rw: "RW 03",
      rtCount: 11,
      kkCount: 1320,
      population: 4410,
      microBusinessEstimate: 35,
      description: "Kawasan hunian aktif dengan aneka rumah jahit busana serta kuliner keluarga."
    },
    {
      rw: "RW 04",
      rtCount: 16,
      kkCount: 1950,
      population: 6200,
      microBusinessEstimate: 58,
      description: "Bersebelahan dengan koridor industri kecil PIK Penggilingan, sentra bengkel las, bubut, dan perdagangan sembako."
    },
    {
      rw: "RW 05",
      rtCount: 13,
      kkCount: 1540,
      population: 4980,
      microBusinessEstimate: 46,
      description: "Kawasan dinamis dengan produsen kue basah tradisional rumahan serta jasa laundry kiloan."
    },
    {
      rw: "RW 06",
      rtCount: 15,
      kkCount: 1820,
      population: 5740,
      microBusinessEstimate: 64,
      description: "Sentra pengrajin konveksi pakaian, celana, seragam garmen dan warung sarapan Betawi."
    },
    {
      rw: "RW 07",
      rtCount: 10,
      kkCount: 1210,
      population: 3950,
      microBusinessEstimate: 32,
      description: "Wilayah dekat Klender Baru dengan unit percetakan digital, sablon, serta pangkalan gas dan galon."
    }
  ] as RwStat[]
};
