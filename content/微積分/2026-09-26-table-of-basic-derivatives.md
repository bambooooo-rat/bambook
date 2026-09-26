---
title: 基本函數的微分公式表
date: 2026-09-26
tags: 微分, 公式, 三角函數, 指數與對數, 微積分乙
summary: 冪函數、絕對值函數、指對數函數、三角函數與反三角函數——把所有基本函數的導函數整理成一張速查表，方便隨時查閱。
---

# 基本函數的微分公式表

這篇文章不打算重新推導每一條公式，而是把常數函數、冪函數、絕對值函數、指對數函數、三角函數與反三角函數的導函數，整理成一張速查表，方便需要時直接查閱。

## 常數函數與冪函數

$$\frac{\mathrm d}{\mathrm dx}\bigl(c\bigr)=0 \qquad\qquad \frac{\mathrm d}{\mathrm dx}\bigl(x^p\bigr)=p\cdot x^{p-1}\quad(\forall p\in\mathbb R)$$

## 絕對值函數

$$\frac{\mathrm d}{\mathrm dx}\bigl(|x|\bigr)=\frac{x}{|x|}\ (x\neq0) \qquad\qquad \frac{\mathrm d}{\mathrm dx}\bigl(|f(x)|\bigr)=\frac{f(x)}{|f(x)|}\cdot f'(x)\ (f(x)\neq0)$$

## 指數與對數函數

$$\frac{\mathrm d}{\mathrm dx}\bigl(a^x\bigr)=a^x\ln a \qquad\qquad \frac{\mathrm d}{\mathrm dx}\bigl(\log_ax\bigr)=\frac{1}{x\ln a}$$

當底數 $a=e$ 時，分別簡化為最基本的兩個結果：$(e^x)'=e^x$、$(\ln x)'=\dfrac1x$。

## 三角函數

| 函數 | 導函數 | 函數 | 導函數 |
| :--- | :--- | :--- | :--- |
| $\sin x$ | $\cos x$ | $\cos x$ | $-\sin x$ |
| $\tan x$ | $\sec^2x$ | $\cot x$ | $-\csc^2x$ |
| $\sec x$ | $\sec x\tan x$ | $\csc x$ | $-\csc x\cot x$ |

左欄與右欄互為「co-」搭檔，右欄（帶 co- 開頭）的導函數都比左欄多一個負號。

## 反三角函數

| 函數 | 導函數 | 函數 | 導函數 |
| :--- | :--- | :--- | :--- |
| $\arcsin x$ | $\dfrac{1}{\sqrt{1-x^2}}$ | $\arccos x$ | $-\dfrac{1}{\sqrt{1-x^2}}$ |
| $\arctan x$ | $\dfrac{1}{1+x^2}$ | $\operatorname{arccot}x$ | $-\dfrac{1}{1+x^2}$ |
| $\operatorname{arcsec}x$ | $\dfrac{1}{|x|\sqrt{x^2-1}}$ | $\operatorname{arccsc}x$ | $-\dfrac{1}{|x|\sqrt{x^2-1}}$ |

同樣地，右欄的反三角函數導函數，都恰好是左欄對應導函數的相反數。

## 使用這張表的方法

這張表本身建議搭配「微分運算定理與連鎖律」一起使用：遇到的函數如果不是表格裡列出的基本函數，而是好幾個基本函數經過加減乘除或合成組合出來的結果，就需要先把運算定理套進去，把問題拆解成表格裡查得到的基本導函數，再組合回去。這張表的角色，是提供「積木」本身，而不是教怎麼把積木組裝起來。
