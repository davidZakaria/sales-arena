export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agency/:path*",
    "/open-race/:path*",
    "/portfolio/:path*",
    "/manager/:path*",
  ],
};
