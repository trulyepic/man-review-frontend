type Props = {
  variant?: "header" | "footer" | "inline";
};

const SocialLinks = ({ variant = "inline" }: Props) => {
  const iconClass =
    variant === "header" || variant === "footer"
      ? "w-5 h-5 object-contain"
      : "w-4 h-4 object-contain inline-block mr-1";

  const linkClass =
    variant === "header"
      ? "text-gray-700 hover:text-pink-500"
      : variant === "footer"
      ? "hover:underline"
      : "text-pink-500 hover:underline";

  return (
    <a
      href="https://instagram.com/toonranks"
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
      title="Follow us on Instagram"
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
        alt="Instagram"
        className={iconClass}
      />
      {variant === "inline" && "Instagram"}
    </a>
  );
};

export default SocialLinks;
