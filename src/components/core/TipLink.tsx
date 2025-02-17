import { URLS } from "../../urls";

function TipLink({ isChinese }: { isChinese: boolean }) {
  return (
    <a
      className="text-xs underline text-gray-500 text-right"
      href={URLS.tips}
      target="_blank"
      rel="noopener"
    >
      { isChinese ? "获得更好结果的技巧" : "Tips for better results" }
    </a>
  );
}

export default TipLink;
