import React from "react";

interface Props {
  // ❌ giữ lại cho tương thích nếu nơi khác truyền vào
  zones?: any;
  placed?: Record<string, string>;
  labelsMap?: Map<string, any>;
  containerWidth?: number;
  containerHeight?: number;
}

/**
 * 🔥 Connector đã bị disable hoàn toàn
 */
const BodyPartConnectors: React.FC<Props> = () => {
  return null;
};

export default BodyPartConnectors;