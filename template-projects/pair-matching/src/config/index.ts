// Logic tính toán Grid
export const calculateGrid = (total: number) => {
  let cols = Math.ceil(Math.sqrt(total));
  let rows = Math.ceil(total / cols);
  // Đảm bảo tổng số ô là chẵn để có cặp
  if ((cols * rows) % 2 !== 0) {
    if (cols <= rows) cols++;
    else rows++;
  }
  return { cols, rows };
};
