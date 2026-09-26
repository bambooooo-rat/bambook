---
title: 微分運算定理與連鎖律
date: 2026-09-26
tags: 微分, 微積分乙
summary: 知道了幾個基本函數的導函數之後，要怎麼處理它們加減乘除或組合起來的複雜函數？整理微分對四則運算與函數合成的規則，特別是連鎖律「一層一層微進去」的訣竅。
---

# 微分運算定理與連鎖律

只知道冪函數、指數函數、三角函數這些基本函數的導函數還不夠——實際遇到的函數,往往是這些基本函數經過加減乘除或彼此合成組合出來的。這篇文章整理微分對這些運算的規則。

## 線性：加法與係數積可以「拆開」

由導函數的定義可以直接證明：

$$\frac{\mathrm d}{\mathrm dx}\bigl(\alpha f+\beta g\bigr)(x)=\alpha\frac{\mathrm d}{\mathrm dx}f(x)+\beta\frac{\mathrm d}{\mathrm dx}g(x)$$

也就是說，微分對函數的加法與係數積是可以「拆開」的，這個性質稱為**線性（Linear）**。有了線性，配合冪函數 $x^p$ 的導函數，就能直接得到任意多項式的導函數，不需要每一項都回去用定義驗證。

## 乘法、除法與合成：不能直接拆開

加法可以拆開，但乘法、除法就不行了——$(fg)'\neq f'\cdot g'$。這幾種運算各自有自己的規則：

> 給定 $f(x)$、$g(x)$ 在 $x=x_0$ 可微，$c\in\mathbb R$：
> $$\bigl(c\cdot f\bigr)'(x_0)=c\cdot f'(x_0)$$
> $$\bigl(f+g\bigr)'(x_0)=f'(x_0)+g'(x_0)$$
> $$\bigl(f\cdot g\bigr)'(x_0)=f'(x_0)\cdot g(x_0)+f(x_0)\cdot g'(x_0)$$
> $$\left(\frac fg\right)'(x_0)=\frac{f'(x_0)\cdot g(x_0)-f(x_0)\cdot g'(x_0)}{g^2(x_0)}$$
>
> 若 $f(x)$ 在 $x=x_0$ 可微、$g(x)$ 在 $x=f(x_0)$ 可微：
> $$\bigl(g\circ f\bigr)'(x_0)=g'\bigl(f(x_0)\bigr)\cdot f'(x_0)$$

最後一條是微分對函數合成的規則，稱為**連鎖律（Chain Rule）**。

有了乘法、除法規則，配合 $\sin x$、$\cos x$ 的導函數，就能直接推出其餘四個三角函數的導函數。比如 $\tan x=\dfrac{\sin x}{\cos x}$，用除法規則：

$$\tan'x=\frac{\sin'x\cdot\cos x-\sin x\cdot\cos'x}{\cos^2x}=\frac{\cos^2x+\sin^2x}{\cos^2x}=\sec^2x$$

同樣的手法，配合 $\cot x=\dfrac1{\tan x}$、$\sec x=\dfrac1{\cos x}$、$\csc x=\dfrac1{\sin x}$，可以推出其餘導函數。

## 連鎖律：一層一層微進去

連鎖律是最容易出錯、也最需要練習的一條規則。要對形如 $\blacksquare\bigl(\blacktriangle(x)\bigr)$（外層是 $\blacksquare$、內層是 $\blacktriangle(x)$）的複合函數微分，訣竅是：**先不動內層，把外層當成一個整體先微分**，得到 $\blacksquare'\bigl(\blacktriangle(x)\bigr)$，**再乘上內層本身的微分** $\blacktriangle'(x)$，最終結果是

$$\blacksquare'\bigl(\blacktriangle(x)\bigr)\cdot\blacktriangle'(x)$$

如果遇到更多層的複合函數，就一層一層依樣重複下去。用萊布尼茲符號來看會更直觀：$\dfrac{\mathrm d\blacksquare}{\mathrm dx}=\dfrac{\mathrm d\blacksquare}{\mathrm d\blacktriangle}\cdot\dfrac{\mathrm d\blacktriangle}{\mathrm dx}$，等號右側分子分母的 $\mathrm d\blacktriangle$ 就像互相抵消掉了一樣，這也是為什麼連鎖律用萊布尼茲符號記憶起來特別直覺。

> **例.** 求 $\dfrac{\mathrm d}{\mathrm dx}\Bigl(e^{\cos^2(\pi x-1)}\Bigr)$。
>
> 這是三層合成：最外層是 $e^{(\cdot)}$，中間是 $(\cdot)^2$，最內層是 $\cos(\pi x-1)$。一層一層微進去：
> $$\frac{\mathrm d}{\mathrm dx}e^{\cos^2(\pi x-1)}=e^{\cos^2(\pi x-1)}\cdot\Bigl(\cos^2(\pi x-1)\Bigr)'$$
> $$=e^{\cos^2(\pi x-1)}\cdot 2\cos(\pi x-1)\cdot\bigl(\cos(\pi x-1)\bigr)'$$
> $$=e^{\cos^2(\pi x-1)}\cdot 2\cos(\pi x-1)\cdot\bigl(-\sin(\pi x-1)\bigr)\cdot\pi$$
> $$=-2\pi\, e^{\cos^2(\pi x-1)}\cos(\pi x-1)\sin(\pi x-1)$$

每一步都只處理「當下最外層」的那個函數，把裡面的東西暫時當成一個黑盒子，微完之後再乘上黑盒子自己的微分——這樣不管疊了幾層，都不會漏掉任何一層。

## 一個小應用：絕對值函數的微分

連鎖律還可以幫我們推出絕對值函數的導函數。利用恆等式 $|x|^2=x^2$，兩邊對 $x$ 微分（左邊用連鎖律，$|x|$ 是內層）：

$$2|x|\cdot|x|'=2x \quad\Longrightarrow\quad |x|'=\frac{x}{|x|}\quad(x\neq0)$$

同樣的手法可以推廣到 $\bigl(|f(x)|\bigr)'=\dfrac{f(x)}{|f(x)|}\cdot f'(x)$（$f(x)\neq0$）——這其實就是先把 $|f(x)|$ 看成外層 $|\blacktriangle|$、內層 $\blacktriangle=f(x)$，再套用連鎖律的結果。
