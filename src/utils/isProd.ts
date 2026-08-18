const isProd = () => Boolean(window.location.href.match(/vercel/));

export default isProd;
