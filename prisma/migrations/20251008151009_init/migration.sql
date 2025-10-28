-- CreateTable
CREATE TABLE "links" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "baseLink" TEXT NOT NULL,
    "shortLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_stats" (
    "id" SERIAL NOT NULL,
    "redirectsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkId" INTEGER NOT NULL,

    CONSTRAINT "link_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_redirects" (
    "id" SERIAL NOT NULL,
    "linkStatsId" INTEGER NOT NULL,
    "ip" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "device" TEXT,
    "isMobile" BOOLEAN,
    "isTablet" BOOLEAN,
    "country" TEXT,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "link_redirects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "links_shortLink_key" ON "links"("shortLink");

-- CreateIndex
CREATE UNIQUE INDEX "link_stats_linkId_key" ON "link_stats"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "link_redirects_linkStatsId_key" ON "link_redirects"("linkStatsId");

-- AddForeignKey
ALTER TABLE "link_stats" ADD CONSTRAINT "link_stats_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_redirects" ADD CONSTRAINT "link_redirects_linkStatsId_fkey" FOREIGN KEY ("linkStatsId") REFERENCES "link_stats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
