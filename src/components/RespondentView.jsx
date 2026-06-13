import React, { useMemo, useState } from "react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M16.25 5.75 8.5 13.5l-3.75-3.75" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
    </svg>
  );
}

function normalizeQuestions(survey) {
  if (Array.isArray(survey?.questions)) return survey.questions;
  if (!Array.isArray(survey?.pages)) return [];
  return survey.pages.flatMap((page) =>
    Array.isArray(page.questions)
      ? page.questions.map((question) => ({ ...question, pageId: page.id, pageTitle: page.title }))
      : []
  );
}

function getQuestionType(question) {
  const type = String(question?.type || "text").toLowerCase();
  if (type === "multi") return "multiple";
  if (type === "dropdown") return "select";
  if (type === "image" || question?.imageChoice) return "image";
  if (["single", "multiple", "select", "rating", "text"].includes(type)) return type;
  return "text";
}

function isAnswered(question, value) {
  if (!question?.required) return true;
  if (Array.isArray(value)) return value.length > 0;
  return String(value ?? "").trim().length > 0;
}

function Background({ survey }) {
  const bgColor = survey?.themeColor || survey?.theme?.bgColor || "#f8fafc";
  return (
    <>
      {survey?.backgroundUrl ? (
        <img src={survey.backgroundUrl} alt="" className="fixed inset-0 h-full w-full object-cover" aria-hidden="true" />
      ) : (
        <div className="fixed inset-0" style={{ backgroundColor: bgColor }} aria-hidden="true" />
      )}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
    </>
  );
}

function WelcomeStep({ survey, totalQuestions, onStart }) {
  return (
    <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden px-4 py-10">
      <Background survey={survey} />
      <section className="bg-white/10 backdrop-blur-md border border-white/20 p-8 sm:p-10 rounded-3xl text-center z-10 max-w-2xl w-full shadow-2xl">
        <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
          Asking
        </span>
        <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-white">
          {survey?.title || "Анкета"}
        </h1>
        <p className="mt-5 text-base sm:text-lg leading-8 text-white/80">
          {survey?.description || "Ответьте на несколько вопросов. Это займет немного времени."}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-white/70">
          <span className="rounded-full bg-white/10 px-4 py-2">{totalQuestions} вопросов</span>
        </div>
        <button
          type="button"
          onClick={onStart}
          className="mt-9 inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-base font-semibold text-slate-950 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-blue-50 active:translate-y-0"
        >
          Начать
        </button>
      </section>
    </main>
  );
}

function ImageChoice({ question, value, onChange, hasError }) {
  const selected = String(value || "");
  const options = Array.isArray(question.options) ? question.options : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {options.map((option, index) => {
        const optionValue = option.value ?? option.text ?? String(index + 1);
        const active = selected === String(optionValue);
        return (
          <button
            key={option.id || optionValue}
            type="button"
            onClick={() => onChange(String(optionValue))}
            className={cx(
              "relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 text-left bg-white",
              active ? "border-blue-600 shadow-lg shadow-blue-600/15 scale-[1.01]" : "border-slate-200 hover:border-blue-300",
              hasError && !active && "border-red-200"
            )}
          >
            <div className="relative">
              <img
                src={option.imageUrl || option.image || "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=72"}
                alt={option.text || "Вариант ответа"}
                className={cx("w-full h-48 object-cover transition duration-200", active && "brightness-75")}
              />
              {active && (
                <span className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white shadow-lg">
                  <CheckIcon />
                </span>
              )}
            </div>
            <span className="block px-4 py-3 text-center text-sm font-semibold text-slate-800">
              {option.text || `Вариант ${index + 1}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ChoiceList({ question, value, onChange }) {
  const type = getQuestionType(question);
  const multiple = type === "multiple";
  const options = Array.isArray(question.options) ? question.options : [];
  const current = multiple ? (Array.isArray(value) ? value : []) : String(value || "");

  return (
    <div className="mt-6 space-y-3">
      {options.map((option, index) => {
        const optionValue = option.value ?? option.text ?? String(index + 1);
        const active = multiple ? current.includes(String(optionValue)) : current === String(optionValue);
        return (
          <label
            key={option.id || optionValue}
            className={cx(
              "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition",
              active ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200 bg-white hover:border-blue-300"
            )}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={`question-${question.id}`}
              checked={active}
              onChange={() => {
                if (!multiple) return onChange(String(optionValue));
                onChange(active ? current.filter((item) => item !== String(optionValue)) : [...current, String(optionValue)]);
              }}
              className="h-4 w-4 accent-blue-600"
            />
            <span className="text-sm font-medium">{option.text || `Вариант ${index + 1}`}</span>
          </label>
        );
      })}
    </div>
  );
}

function QuestionInput({ question, value, onChange, hasError }) {
  const type = getQuestionType(question);
  if (type === "image") return <ImageChoice question={question} value={value} onChange={onChange} hasError={hasError} />;
  if (type === "single" || type === "multiple") return <ChoiceList question={question} value={value} onChange={onChange} />;
  if (type === "select") {
    return (
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        <option value="">Выберите вариант</option>
        {(question.options || []).map((option, index) => (
          <option key={option.id || index} value={option.value ?? option.text}>
            {option.text || `Вариант ${index + 1}`}
          </option>
        ))}
      </select>
    );
  }
  return (
    <textarea
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      rows={4}
      placeholder="Введите ответ"
      className="mt-8 w-full resize-none border-0 border-b-2 border-slate-200 bg-transparent px-0 py-4 text-2xl font-medium text-slate-900 outline-none placeholder:text-slate-300 transition focus:border-blue-600"
    />
  );
}

function QuestionStep({ question, value, onChange, error, direction, onBack, onNext, isLast, isLoading, canBack }) {
  return (
    <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden px-4 py-12">
      <div className="fixed inset-0 bg-slate-50" aria-hidden="true" />
      <section
        key={question.id}
        className={cx(
          "max-w-2xl w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 z-10 relative transition-all duration-300",
          direction === "forward" ? "animate-[slideInRight_300ms_ease-out]" : "animate-[slideInLeft_300ms_ease-out]"
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          {question.required && (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
              Обязательный
            </span>
          )}
          {question.pageTitle && <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{question.pageTitle}</span>}
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{question.title || question.text || "Вопрос"}</h2>
        {(question.description || question.helpText) && (
          <p className="mt-3 text-base leading-7 text-slate-500">{question.description || question.helpText}</p>
        )}
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
        <QuestionInput question={question} value={value} onChange={onChange} hasError={Boolean(error)} />
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={!canBack || isLoading}
            className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"
          >
            Назад
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={isLoading}
            className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-70"
          >
            {isLoading ? <LoadingIcon /> : null}
            {isLoading ? "Отправляем..." : isLast ? "Отправить анкету" : "Далее"}
          </button>
        </div>
      </section>
    </main>
  );
}

export default function RespondentView({ survey, submitUrl, onSubmitted }) {
  const questions = useMemo(() => normalizeQuestions(survey), [survey]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [direction, setDirection] = useState("forward");

  const questionIndex = currentStep - 1;
  const question = questions[questionIndex];
  const progress = currentStep === 0 ? 0 : Math.round((questionIndex / Math.max(1, questions.length)) * 100);

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => ({ ...prev, [questionId]: "" }));
  };

  const validateCurrent = () => {
    if (!question) return true;
    const value = answers[question.id];
    if (isAnswered(question, value)) return true;
    setErrors((prev) => ({ ...prev, [question.id]: "Пожалуйста, ответьте на обязательный вопрос" }));
    return false;
  };

  const onSubmit = async () => {
    if (!validateCurrent() || isLoading) return;
    setIsLoading(true);
    try {
      const payload = {
        answers: questions
          .filter((item) => answers[item.id] !== undefined && answers[item.id] !== "")
          .map((item) => ({ questionId: item.id, value: answers[item.id] })),
        submissionId: `submit_${survey?.id || "survey"}_${Date.now()}_${Math.random().toString(16).slice(2)}`
      };
      const response = await fetch(submitUrl || `/api/surveys/${survey.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Не удалось отправить анкету");
      setIsCompleted(true);
      onSubmitted?.(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (!validateCurrent()) return;
    if (questionIndex >= questions.length - 1) {
      onSubmit();
      return;
    }
    setDirection("forward");
    setCurrentStep((step) => step + 1);
  };

  if (isCompleted) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
        <section className="max-w-xl rounded-3xl bg-white p-10 text-center shadow-xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-600 text-white"><CheckIcon /></div>
          <h1 className="mt-6 text-3xl font-bold text-slate-900">Спасибо за прохождение</h1>
          <p className="mt-3 text-slate-500">Результаты отправлены на базу.</p>
        </section>
      </main>
    );
  }

  if (currentStep === 0) {
    return <WelcomeStep survey={survey} totalQuestions={questions.length} onStart={() => setCurrentStep(1)} />;
  }

  return (
    <>
      <div className="fixed top-0 left-0 z-50 h-1 bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-32px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
      <QuestionStep
        question={question}
        value={answers[question.id]}
        onChange={(value) => setAnswer(question.id, value)}
        error={errors[question.id]}
        direction={direction}
        onBack={() => {
          setDirection("back");
          setCurrentStep((step) => Math.max(0, step - 1));
        }}
        onNext={handleNext}
        isLast={questionIndex >= questions.length - 1}
        isLoading={isLoading}
        canBack={currentStep > 0}
      />
    </>
  );
}
