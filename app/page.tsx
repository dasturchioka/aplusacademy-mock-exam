"use client";

import DotGrid from "@/components/r-bits/DotGrid/DotGrid";
import BlurText from "@/components/r-bits/BlurText/BlurText";
import ClickSpark from "@/components/r-bits/ClickSpark/ClickSpark";
import EnterExamHomeButton from "@/components/ui/enter-exam-home";
import Cubes from "@/components/r-bits/Cubes/Cubes";
import { Figtree, Manrope, Montserrat } from "next/font/google";
import EnterAdminPanelButton from "@/components/ui/enter-admin-panel";
import FadeContent from "@/components/r-bits/FadeContent/FadeContent";
import Image from "next/image";
import { FaInstagram, FaPhone, FaTelegram } from "react-icons/fa";

const montserrat = Montserrat({ weight: "800", subsets: ["latin"] });
const manrope = Manrope({ subsets: ["latin"] });
const figtree = Figtree({ subsets: ["latin"] });

export default function HomePage() {
  return (
    <div className="min-h-screen relative">
      <ClickSpark
        sparkColor="#2B7FFF"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={14}
        duration={400}
      >
        <div
          className="-z-10"
          style={{ width: "100%", height: "100vh", position: "absolute" }}
        >
          <DotGrid
            dotSize={5}
            gap={10}
            baseColor="#EEEEEE"
            activeColor="#2B7FFF"
            proximity={120}
            shockRadius={250}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
          />
        </div>
        <div className="content flex flex-col justify-between">
          <div className="container mx-auto h-screen py-8 flex flex-col justify-between">
            <header className="h-screen">
              <nav className="py-4 flex items-center justify-between">
                <div className="left-part"></div>
                <div className="right-part"></div>
              </nav>
              <main className="relative flex justify-between items-center mt-28">
                <div
                  style={{
                    boxShadow: "0px 2px 230px 240px rgba(255,255,255,1)",
                  }}
                  className="texts space-y-8 py-6 bg-white"
                >
                  <FadeContent
                    blur={true}
                    duration={2000}
                    easing="ease-out"
                    initialOpacity={0}
                  >
                    <div className="transition-all w-full flex justify-self-end self-end gap-4">
                      <a
                        className="social-media flex items-center gap-1 transition-all hover:text-primary"
                        href="https://www.instagram.com/stories/aplusacademy_ielts/"
                        target="_blank"
                      >
                        <FaInstagram className="size-5" /> Instagram
                      </a>
                      <a
                        className="social-media flex items-center gap-1 transition-all hover:text-primary"
                        href="https://t.me/aplusacademyielts"
                        target="_blank"
                      >
                        <FaTelegram className="size-5" /> Telegram
                      </a>
                      <a
                        className="social-media flex items-center gap-1 transition-all hover:text-primary"
                        href="tel:+998914214488"
                        target="_blank"
                      >
                        <FaPhone className="size-4" /> +998 91 421 44 88
                      </a>
                    </div>
                  </FadeContent>

                  <div className="">
                    <BlurText
                      text="IELTS Exam Platform"
                      delay={150}
                      animateBy="words"
                      direction="top"
                      className={`text-6xl text-blue-500 ${montserrat.className}`}
                    />
                  </div>

                  <FadeContent
                    blur={true}
                    duration={1000}
                    easing="ease-out"
                    initialOpacity={0}
                  >
                    <div className="p-text w-[700px] mb-8 px-1">
                      <p
                        className={`${manrope.className} text-lg leading-8 opacity-80 font-medium`}
                      >
                        At Aplusacademy, our Mock Exam Platform offers a
                        realistic IELTS test experience with full support for
                        Listening, Reading, Writing, and Speaking sections.
                        Designed to mirror the official exam format, it features
                        auto-saving, answer tracking, and performance feedback —
                        helping students build confidence through smart,
                        structured practice.
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <EnterExamHomeButton bg="bg-blue-500" />
                      <div className="opacity-0 transition-all hover:opacity-100">
                        <EnterAdminPanelButton />
                      </div>
                    </div>
                  </FadeContent>
                </div>
              </main>

              <div className="transition-all w-full flex justify-self-end self-end">
                <p className={`${figtree.className} z-50`}>
                  made by{" "}
                  <a
                    className="underline"
                    target="_blank"
                    href="https://dasturchioka.uz"
                  >
                    <span className="text-blue-500">@</span>dasturchioka
                  </a>
                </p>
              </div>
            </header>
          </div>
        </div>
      </ClickSpark>
    </div>
  );
}
