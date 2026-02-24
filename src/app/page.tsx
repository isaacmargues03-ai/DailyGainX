import { Header } from '@/components/header';
import { ImageCarousel } from '@/components/image-carousel';
import Image from 'next/image';

const petrobrasLogo =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNDYuOCA1NC4zIiB3aWR0aD0iMzQ2LjgiIGhlaWdodD0iNTQuMyI+PGc+PHBhdGggZmlsbD0iIzAwYTk1MCIgZD0iTTAgMjcuMWgxM3YxM0gweiIvPjxwYXRoIGZpbGw9IiMwMGE5NTAiIGQ9Ik0xMy44IDI3LjFoMTN2MTNoLTEzeiIvPjxwYXRoIGZpbGw9IiNmZWQxMGEiIGQ9Ik0wIDQwLjloMTN2MTMuNEgweiIvPjxwYXRoIGZpbGw9IiNmZWQxMGEiIGQ9Ik0xMy44IDQwLjloMTN2MTMuNGgtMTN6Ii8+PHBhdGggZmlsbD0iIzAwYTk1MCIgZD0iTTAgMTMuM2gxM3YxM0gweiIvPjxwYXRoIGZpbGw9IiMwMGE5NTAiIGQ9Ik0xMy44IDEzLjNoMTN2MTNoLTEzeiIvPjwvZz48cGF0aCBmaWxsPSIjMDAzYjg4IiBkPSJNNjguNSA1My42Vi44aDguNXY0NC4yaDE2LjR2OC42aC0yNXptMzAuNyAwVi44aDI1LjJjMTQgMCAyMS42IDcuOCAyMS42IDIxLjJzLTcuNiAyMS4yLTIxLjYgMjEuMkg5OS4yem04LjUtOC42aDE1YzguNCAwIDEzLTQuOCAxMy0xMnMtNC41LTEyLTEzLTEyaC0xNXYyNHptNDAuNSA4LjZWLjhoMzYuMnY5LjJoLTI3Ljd2OC4zaDI1LjJ2OS4yaC0yNS4yvjcuMWgyNy43djkuMmgtMzYuMnptNTIuNCAwVi44aDguNnY1Mi44aC04LjZ6bTIwLjggMFYuOGgyNS4yYzE0IDAgMjEuNiA3LjggMjEuNiAyMS4yczcuNiAyMS4yLTIxLjYgMjEuMkgxOTF6bTguNS04LjZoMTVjOC40IDAgMTMtNC44IDEzLTEyczQtNS0xMi0xMy0xMmgtMTV2MjR6bTUwLjkgOC42Yy0xMi4yIDAtMjAuMS04LjQtMjAuMS0yMC44UzI2MC42IDEuMSAyNzIuOCAxLjFzMjAuMSA4LjQgMjAuMSAyMC44LTcuOSAzMS43LTIwLjEgMzEuN3ptMC05LjJjNi43IDAgMTAuNS02LjIgMTAuNS0xMS42cy0zLjctMTIuMy0xMC41LTEyLjNzLTEwLjUgNi4yLTEwLjUgMTEuNiAzLjggMTIuMyAxMC41IDEyLjN6bTI5LjggOS4yVi44aDguNXYxNi42bDE2LjEtMTYuNkgzNDNsLTE0LjUgMjAuMSAxNS4zIDIyLjRoLTEwLjVsLTEwLjItMTUuNS01LjIgNy40djguMWgtOC41eiIvPjwvc3ZnPg==';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Nossos patrocinios</h1>
            </div>
            <ImageCarousel />
            <div className="mt-8 flex justify-center">
              <Image
                src={petrobrasLogo}
                alt="Petrobras Logo"
                width={347}
                height={54}
                className="h-auto w-auto"
              />
          </div>
        </div>
      </main>
    </div>
  );
}
