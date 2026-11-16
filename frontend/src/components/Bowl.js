import React from "react";
import Svg, { Circle, Rect, Path, G, Ellipse } from "react-native-svg";

/** Big bowl of cereal-milk ice cream (welcome screen hero). */
export default function Bowl({ width = 290 }) {
  const sp = (x, y, r, c, w = 5, h = 14, k) => <Rect key={k} x={x - w / 2} y={y - h / 2} width={w} height={h} rx={w / 2} fill={c} transform={`rotate(${r} ${x} ${y})`} />;
  return (
    <Svg width={width} height={width * 250 / 300} viewBox="0 0 300 250" accessibilityLabel="A big bowl of cereal milk ice cream topped with cereal, sprinkles and a crispy treat">
      {[sp(25, 51, 30, "#FFD166", 7, 22, 1), sp(265, 45, -35, "#E8508E", 7, 22, 2), sp(43, 127, 70, "#fff", 6, 18, 3), sp(271, 129, 20, "#B388EB", 6, 18, 4),
        sp(143, 15, -60, "#7EE8E4", 6, 18, 5), sp(85, 24, 15, "#fff", 6, 16, 6), sp(217, 20, 50, "#FFD166", 6, 16, 7)]}
      <Circle cx="108" cy="112" r="46" fill="#FFF3E6" />
      <Circle cx="190" cy="108" r="48" fill="#FFB6CF" />
      <Circle cx="150" cy="78" r="50" fill="#9FEDEA" />
      <G fill="none" strokeWidth="6">
        <Circle cx="118" cy="60" r="7" stroke="#FFD166" /><Circle cx="176" cy="54" r="7" stroke="#E8508E" />
        <Circle cx="206" cy="92" r="6.5" stroke="#8BD450" /><Circle cx="94" cy="96" r="6.5" stroke="#B388EB" />
        <Circle cx="150" cy="40" r="6" stroke="#FF8A5B" /><Circle cx="226" cy="118" r="6" stroke="#0B9B96" />
      </G>
      {[sp(134, 72, 40, "#E8508E", 4, 12, 11), sp(162, 90, -30, "#FFD166", 4, 12, 12), sp(188, 80, 70, "#0B9B96", 4, 12, 13),
        sp(114, 90, -60, "#7EE8E4", 4, 12, 14), sp(202, 128, 20, "#fff", 4, 12, 15), sp(142, 108, 80, "#B388EB", 4, 12, 16)]}
      <G transform="rotate(-12 196 52)">
        <Rect x="178" y="36" width="38" height="28" rx="6" fill="#F3D9A4" stroke="#fff" strokeWidth="3" />
        <G fill="#D9A95A"><Circle cx="186" cy="44" r="2" /><Circle cx="196" cy="50" r="2" /><Circle cx="207" cy="43" r="2" /><Circle cx="190" cy="56" r="2" /><Circle cx="204" cy="56" r="2" /></G>
      </G>
      <G transform="rotate(32 244 96)">
        <Ellipse cx="244" cy="66" rx="13" ry="17" fill="#fff" stroke="#077470" strokeWidth="3" />
        <Rect x="239" y="82" width="10" height="26" rx="5" fill="#E8508E" />
        <Rect x="238" y="108" width="12" height="26" rx="6" fill="#0B9B96" />
        <Circle cx="244" cy="108" r="3" fill="#fff" />
      </G>
      <Path d="M40 132h220c0 58-48 96-110 96S40 190 40 132z" fill="#E8508E" />
      <Path d="M40 132h220c-1 8-3 15-6 22H46c-3-7-5-14-6-22z" fill="#B8336B" />
      <Rect x="34" y="124" width="232" height="16" rx="8" fill="#fff" />
      {[sp(87, 175, 30, "#fff", 6, 18, 21), sp(133, 195, -40, "#FFD166", 6, 18, 22), sp(181, 179, 60, "#7EE8E4", 6, 18, 23), sp(217, 168, -20, "#fff", 6, 16, 24), sp(111, 208, 75, "#7EE8E4", 6, 16, 25)]}
      <Ellipse cx="150" cy="236" rx="74" ry="8" fill="rgba(0,0,0,.12)" />
    </Svg>
  );
}
