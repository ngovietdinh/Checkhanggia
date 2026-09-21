/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // "Giay an ninh" - nen sang, mat, goi lien tuong giay chung nhan/tien
        // giay hon la mot dashboard toi mau thong thuong.
        canvas: {
          DEFAULT: '#EEF1F6',
          surface: '#FFFFFF',
          surface2: '#E3E8F0',
          border: '#C9D2E0',
        },
        // "Muc chinh thuc" - xanh navy dam thay vi den tuyen
        text: {
          DEFAULT: '#0F1F3D',
          muted: '#5B6B85',
        },
        // Mau trang thai: dung mau "dau moc" do lam accent chinh kiem canh bao,
        // xanh la/ho phach cho hop le/canh bao, xanh dam thay cho xanh neon cu.
        verify: {
          valid: '#2F7D4F',
          danger: '#A32639',
          warn: '#966400',
          data: '#1B5E6B',
        },
        // Bac anh kim - goi lop cao bac tren tem, dung cho vien/hoa tiet trang tri
        foil: '#9AA3AE',
        // Vang dong - dung rat han che cho diem nhan dac biet (vd rich chung nhan)
        seal: '#A9862F',
      },
      fontFamily: {
        // Fraunces cho tieu de - serif co ca tinh, goi chung chi/giay to trang trong
        display: ['Fraunces', 'ui-serif', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(47, 125, 79, 0.25), 0 8px 24px rgba(15, 31, 61, 0.08)',
      },
      backgroundImage: {
        // Hoa tiet van song mo nhat (guilloche-lite) - lay cam hung tu hoa tiet
        // an ninh in tren tien/chung chi, dung lam nen trang trai nghiem, khong
        // phai decoration ngau nhien.
        guilloche:
          'repeating-linear-gradient(115deg, rgba(15,31,61,0.035) 0px, rgba(15,31,61,0.035) 1px, transparent 1px, transparent 6px)',
      },
    },
  },
  plugins: [],
};
