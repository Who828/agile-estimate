(ns cljs-intro.estimate
  (:require
    [domina :as d]
    [clojure.browser.event :as event]))

(def stats-button (d/by-id "stats-btn"))

(defn all-estimate [amount point-cap stories choices]
  (cond (and (= amount 0) (= stories 0)) [choices]
    (or (< amount 0) (= point-cap 0) (= stories 0)) `()
    :else (into (all-estimate (- amount point-cap) point-cap (- stories 1) (conj choices point-cap))
      (all-estimate amount (- point-cap 1) stories choices))))

(defn estimate [amount stories]
  (let  [coll (all-estimate amount 3 stories [])]
  (if (empty? coll)
    []
  (shuffle (rand-nth coll
   )))))

(event/listen
  stats-button
  "click"
  (fn [] (d/set-text! (d/by-id "results") (estimate (d/value (d/by-id "velocity")) (d/value (d/by-id "stories"))))))

