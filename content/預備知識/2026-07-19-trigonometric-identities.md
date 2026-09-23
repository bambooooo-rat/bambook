---
title: 三角恆等式
date: 2026-09-23
tags: 公式, 化簡, 微積分乙
summary: 畢氏恆等式、和角公式、倍角公式、半角公式——植基於單位圓幾何性質，推導出微積分與工程數學中最常用到的一系列三角恆等式。
---

# 三角恆等式

三角函數可以透過單位圓（半徑 $r=1$ 的圓）上一點 $P(x,y)$ 的座標來定義：$\cos\theta=x$、$\sin\theta=y$。這篇文章整理幾個植基於單位圓幾何性質、微積分與工程數學裡最常用到的三角恆等式。

當 $r=1$ 時，應用畢氏定理於參考直角三角形，即可得到三角學中最常使用之恆等式：
$$\cos^2\theta + \sin^2\theta = 1$$
將上式分別除以 $\cos^2\theta$ 與 $\sin^2\theta$，可進一步推得：
$$1 + \tan^2\theta = \sec^2\theta$$
$$1 + \cot^2\theta = \csc^2\theta$$

對於任意角 $A$ 與 $B$，下列和角公式恆成立：
$$\cos(A+B) = \cos A \cos B - \sin A \sin B$$
$$\sin(A+B) = \sin A \cos B + \cos A \sin B$$

將和差角公式中之 $A$ 與 $B$ 皆代換為 $\theta$，可推導出倍角公式：
$$\cos 2\theta = \cos^2\theta - \sin^2\theta = 2\cos^2\theta -1 = 1-2\sin^2\theta$$
$$\sin 2\theta = 2\sin\theta\cos\theta$$

進一步結合 $\cos^2\theta + \sin^2\theta = 1$ 與 $\cos^2\theta - \sin^2\theta = \cos 2\theta$ 兩式，透過相加與相減整理，可得在積分中常之半角公式，它可以將高次方的三角函數降次：
$$\cos^2\theta = \frac{1+\cos 2\theta}{2}$$
$$\sin^2\theta = \frac{1-\cos 2\theta}{2}$$
